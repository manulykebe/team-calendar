import { Event } from "../types";
import { readSiteData, writeSiteData } from "../utils";

export async function getEvents(site: string) {
  const data = await readSiteData(site);
  return data.events;
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
  const data = await readSiteData(params.site);

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

  data.events.push(newEvent);
  await writeSiteData(params.site, data);
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
  const data = await readSiteData(params.site);

  const event = data.events.find((e: Event) => e.id === params.id);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.userId !== params.userId) {
    throw new Error("Not authorized to update this event");
  }

  Object.assign(event, {
    title: params.title,
    description: params.description,
    date: params.date,
    endDate: params.endDate,
    updatedAt: new Date().toISOString(),
  });

  await writeSiteData(params.site, data);
  return event;
}

export async function deleteEvent(params: {
  id: string;
  userId: string;
  site: string;
  userRole?: string;
}) {
  const data = await readSiteData(params.site);

  const eventIndex = data.events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1) {
    throw new Error("Event not found");
  }

  // Allow deletion if user is admin or owns the event
  const isAdmin = params.userRole === "admin";
  const isOwner = data.events[eventIndex].userId === params.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("Not authorized to delete this event");
  }

  // Remove the event from the array
  data.events.splice(eventIndex, 1);
  
  // Save the updated data back to the file
  await writeSiteData(params.site, data);
}