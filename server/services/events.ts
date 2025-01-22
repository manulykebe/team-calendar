import { Event } from "../types.js";
import { readUserEvents, writeUserEvents } from "../utils.js";

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events.push(newEvent);
  await writeUserEvents(params.site, params.userId, events);
  return newEvent;
}

export async function updateEvent(params: {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  userId: string;
  site: string;
}) {
  const events = await readUserEvents(params.site, params.userId);

  const eventIndex = events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1) {
    throw new Error("Event not found");
  }

  if (events[eventIndex].userId !== params.userId) {
    throw new Error("Not authorized to update this event");
  }

  const updatedEvent = {
    ...events[eventIndex],
    title: params.title,
    description: params.description,
    date: params.date,
    endDate: params.endDate,
    updatedAt: new Date().toISOString(),
  };

  events[eventIndex] = updatedEvent;
  await writeUserEvents(params.site, params.userId, events);
  return updatedEvent;
}

export async function deleteEvent(params: {
  id: string;
  userId: string;
  site: string;
  userRole?: string;
}) {
  const events = await readUserEvents(params.site, params.userId);

  const eventIndex = events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1) {
    throw new Error("Event not found");
  }

  // Allow deletion if user is admin or owns the event
  const isAdmin = params.userRole === "admin";
  const isOwner = events[eventIndex].userId === params.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("Not authorized to delete this event");
  }

  events.splice(eventIndex, 1);
  await writeUserEvents(params.site, params.userId, events);
}