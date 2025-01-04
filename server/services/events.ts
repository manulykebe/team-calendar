import { Event } from '../types';
import { readSiteData, writeSiteData } from '../utils';

export async function getEvents(site: string) {
  const data = await readSiteData(site);
  return data.events;
}

export async function createEvent(eventData: {
  title: string;
  description: string;
  date: string;
  userId: string;
  site: string;
}) {
  const data = await readSiteData(eventData.site);
  
  const newEvent: Event = {
    id: crypto.randomUUID(),
    userId: eventData.userId,
    title: eventData.title,
    description: eventData.description,
    date: eventData.date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.events.push(newEvent);
  await writeSiteData(eventData.site, data);
  return newEvent;
}

export async function updateEvent(params: {
  id: string;
  title: string;
  description: string;
  date: string;
  userId: string;
  site: string;
}) {
  const data = await readSiteData(params.site);
  
  const event = data.events.find((e: Event) => e.id === params.id);
  if (!event || event.userId !== params.userId) {
    throw new Error('Not authorized');
  }

  Object.assign(event, {
    title: params.title,
    description: params.description,
    date: params.date,
    updatedAt: new Date().toISOString()
  });

  await writeSiteData(params.site, data);
  return event;
}

export async function deleteEvent(params: {
  id: string;
  userId: string;
  site: string;
}) {
  const data = await readSiteData(params.site);
  
  const eventIndex = data.events.findIndex((e: Event) => e.id === params.id);
  if (eventIndex === -1 || data.events[eventIndex].userId !== params.userId) {
    throw new Error('Not authorized');
  }

  data.events.splice(eventIndex, 1);
  await writeSiteData(params.site, data);
}