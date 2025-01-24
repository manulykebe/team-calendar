import { readFile, writeFile, deleteFile, getStorageKey } from "./services/storage.js";
import { User, Event, UserSettings } from "./types.js";

export async function readSiteData(site: string) {
  try {
    const key = getStorageKey("sites", `${site}.json`);
    const data = await readFile(key);
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && error.message === "File not found") {
      return { users: [], events: [] };
    }
    throw error;
  }
}

export async function writeSiteData(site: string, data: { users: User[]; events: Event[] }) {
  const key = getStorageKey("sites", `${site}.json`);
  await writeFile(key, JSON.stringify(data, null, 2));
}

export async function readUserEvents(site: string, userId: string): Promise<Event[]> {
  try {
    const key = getStorageKey("sites", site, "events", `${userId}.json`);
    const data = await readFile(key);
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && error.message === "File not found") {
      return [];
    }
    throw error;
  }
}

export async function writeUserEvents(site: string, userId: string, events: Event[]) {
  const key = getStorageKey("sites", site, "events", `${userId}.json`);
  await writeFile(key, JSON.stringify(events, null, 2));
}

export async function readUserSettings(site: string, userId: string): Promise<UserSettings> {
  try {
    const key = getStorageKey("sites", site, "settings", `${userId}.json`);
    const data = await readFile(key);
    return JSON.parse(data);
  } catch (error) {
    // if (error instanceof Error && error.message === "File not found") {
    //   return {};
    // }
    throw error;
  }
}

export async function writeUserSettings(site: string, userId: string, settings: UserSettings) {
  const key = getStorageKey("sites", site, "settings", `${userId}.json`);
  await writeFile(key, JSON.stringify(settings, null, 2));
}

export async function deleteUserData(site: string, userId: string) {
  // Delete user events
  const eventsKey = getStorageKey("sites", site, "events", `${userId}.json`);
  await deleteFile(eventsKey);

  // Delete user settings
  const settingsKey = getStorageKey("sites", site, "settings", `${userId}.json`);
  await deleteFile(settingsKey);
}