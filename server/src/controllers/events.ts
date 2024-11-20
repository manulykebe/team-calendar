import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthRequest, CalendarEvent } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsDir = path.join(__dirname, '../data/events');

// Add type for events file structure
interface EventsFile {
  events: CalendarEvent[];
}

// Helper to create empty events file
async function createEmptyEventsFile(filePath: string): Promise<void> {
  const emptyData: EventsFile = { events: [] };
  await fs.writeFile(filePath, JSON.stringify(emptyData, null, 2));
}

// Update ensureEventsDirectory function
async function ensureEventsDirectory(site: string, year: string): Promise<string> {
  try {
    // Ensure base events directory exists
    await fs.mkdir(eventsDir, { recursive: true });
    
    // Ensure site directory exists
    const siteDir = path.join(eventsDir, site);
    await fs.mkdir(siteDir, { recursive: true });
    
    // Get file path and check if exists
    const filePath = path.join(siteDir, `${year}.json`);
    
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist - create it
      await createEmptyEventsFile(filePath);
    }
    
    return filePath;
  } catch (error) {
    console.error(`Failed to ensure events directory: ${error}`);
    throw new Error('Failed to access events storage');
  }
}

// Update getEventsFile for better error handling
async function getEventsFile(site: string, year: string): Promise<EventsFile> {
  try {
    const filePath = await ensureEventsDirectory(site, year);
    const data = await fs.readFile(filePath, 'utf8');
    
    try {
      const parsed = JSON.parse(data);
      // Validate file structure
      if (!parsed || !Array.isArray(parsed.events)) {
        await createEmptyEventsFile(filePath);
        return { events: [] };
      }
      return parsed;
    } catch {
      // Invalid JSON - recreate file
      await createEmptyEventsFile(filePath);
      return { events: [] };
    }
  } catch (error) {
    console.error(`Failed to get events file: ${error}`);
    throw new Error('Failed to access events data');
  }
}

async function saveEventsFile(site: string, year: string, data: any) {
  const filePath = await ensureEventsDirectory(site, year);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Map to store debounced save functions
const debouncedSaves = new Map<string, Function>();

// Get debounced save function for site/year
function getDebouncedSave(site: string, year: string) {
  const key = `${site}-${year}`;
  if (!debouncedSaves.has(key)) {
    debouncedSaves.set(
      key,
      debounce(async (events: CalendarEvent[]) => {
        await saveEventsFile(site, year, { events });
      }, 500)
    );
  }
  return debouncedSaves.get(key)!;
}

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { site, year } = req.params;
    
    if (!req.user?.sites.includes(site)) {
      return res.status(403).json({ message: 'Not authorized for this site' });
    }

    const { events } = await getEventsFile(site, year);
    
    // Filter private events if user is not the owner
    const filteredEvents = events.filter((event: CalendarEvent) => 
      !event.private || event.userId === req.user?.id
    );

    res.json({ events: filteredEvents });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { site, year } = req.params;
    const eventData = req.body;
    
    if (!req.user?.sites.includes(site)) {
      return res.status(403).json({ message: 'Not authorized for this site' });
    }

    const { events } = await getEventsFile(site, year);
    
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    events.push(newEvent);
    getDebouncedSave(site, year)(events);

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { site, year, eventId } = req.params;
    const updates = req.body;
    
    if (!req.user?.sites.includes(site)) {
      return res.status(403).json({ message: 'Not authorized for this site' });
    }

    const { events } = await getEventsFile(site, year);
    const eventIndex = events.findIndex((e: CalendarEvent) => e.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = events[eventIndex];
    if (event.userId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to modify this event' });
    }

    events[eventIndex] = {
      ...event,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await saveEventsFile(site, year, { events });
    res.json(events[eventIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { site, year, eventId } = req.params;
    
    if (!req.user?.sites.includes(site)) {
      return res.status(403).json({ message: 'Not authorized for this site' });
    }

    const { events } = await getEventsFile(site, year);
    const eventIndex = events.findIndex((e: CalendarEvent) => e.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = events[eventIndex];
    if (event.userId !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    events.splice(eventIndex, 1);
    await saveEventsFile(site, year, { events });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};