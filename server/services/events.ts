import { Event } from "../types.js";
import { readUserEvents, writeUserEvents, readSiteData } from "../utils.js";
import { I18n, globalI18n } from "../i18n/index.js";

export async function getEvents(site: string) {
  // This will be deprecated once we migrate all events
  return [];
}

export async function getUserEvents(site: string, userId: string) {
  return await readUserEvents(site, userId);
}

export async function createEvent(params: {
  type: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  userId: string;
  site: string;
}) {
  const events = await readUserEvents(params.site, params.userId);

  const newEvent: Event = {
    id: crypto.randomUUID(),
    userId: params.userId,
    type: params.type,
    title: params.title,
    description: params.description,
    date: params.date,
    endDate: params.endDate,
    status: 'pending', // Default status for new events
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events.push(newEvent);
  await writeUserEvents(params.site, params.userId, events);
  return newEvent;
}

export async function updateEvent(params: {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  endDate?: string;
  type?: string;
  status?: 'pending' | 'approved' | 'denied';
  userId: string;
  site: string;
  isAdmin?: boolean;
}) {
  const events = await readUserEvents(params.site, params.userId);
  const i18n = globalI18n; // Use global i18n instance

  const eventIndex = events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1) {
    throw new Error(i18n.t('events.eventNotFound'));
  }

  const existingEvent = events[eventIndex];
  const isAdmin = params.isAdmin || false;
  const isOwner = existingEvent.userId === params.userId;

  // Allow update if user is admin or owns the event
  if (!isAdmin && !isOwner) {
    throw new Error(i18n.t('events.notAuthorizedToModifyEvent'));
  }

  // Build update object with only provided fields
  const updateData: Partial<Event> = {
    updatedAt: new Date().toISOString(),
  };

  if (params.title !== undefined) updateData.title = params.title;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.date !== undefined) updateData.date = params.date;
  if (params.endDate !== undefined) updateData.endDate = params.endDate;
  if (params.type !== undefined) updateData.type = params.type;
  if (params.status !== undefined) updateData.status = params.status;

  const updatedEvent = {
    ...existingEvent,
    ...updateData,
  };

  events[eventIndex] = updatedEvent;
  await writeUserEvents(params.site, params.userId, events);
  return updatedEvent;
}

export async function deleteEvent(params: {
  id: string;
  userId: string;
  site: string;
  isAdmin?: boolean;
}) {
  const events = await readUserEvents(params.site, params.userId);
  const i18n = globalI18n; // Use global i18n instance

  const eventIndex = events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1) {
    throw new Error(i18n.t('events.eventNotFound'));
  }

  // Allow deletion if user is admin or owns the event
  const isAdmin = params.isAdmin || false;
  const isOwner = events[eventIndex].userId === params.userId;

  if (!isAdmin && !isOwner) {
    throw new Error(i18n.t('events.notAuthorizedToModifyEvent'));
  }

  events.splice(eventIndex, 1);
  await writeUserEvents(params.site, params.userId, events);
}

// New function to find event across all users (admin only)
export async function findEventAcrossSite(site: string, eventId: string): Promise<{ event: Event; userId: string } | null> {
  const siteData = await readSiteData(site);
  
  for (const user of siteData.users) {
    try {
      const userEvents = await readUserEvents(site, user.id);
      const event = userEvents.find((e: Event) => e.id === eventId);
      if (event) {
        return { event, userId: user.id };
      }
    } catch (error) {
      // Continue searching if we can't read events for this user
      continue;
    }
  }
  
  return null;
}