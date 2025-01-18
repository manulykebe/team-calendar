import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { User, Event } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function readSiteData(site: string) {
  const filePath = path.join(__dirname, "data", "sites", `${site}.json`);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export async function writeSiteData(
  site: string,
  data: { users: User[]; events: Event[] },
) {
  const filePath = path.join(__dirname, "data", "sites", `${site}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readUserEvents(site: string, userId: string): Promise<Event[]> {
  const dirPath = path.join(__dirname, "data", "sites", site, "events");
  const filePath = path.join(dirPath, `${userId}.json`);

  try {
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    // Try to read the file
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeUserEvents(site: string, userId: string, events: Event[]) {
  const dirPath = path.join(__dirname, "data", "sites", site, "events");
  const filePath = path.join(dirPath, `${userId}.json`);

  // Ensure directory exists
  await fs.mkdir(dirPath, { recursive: true });
  
  // Write events to file
  await fs.writeFile(filePath, JSON.stringify(events, null, 2));
}