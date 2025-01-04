import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Event } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function readSiteData(site: string) {
  const filePath = path.join(__dirname, 'data', 'sites', `${site}.json`);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function writeSiteData(site: string, data: { users: User[]; events: Event[] }) {
  const filePath = path.join(__dirname, 'data', 'sites', `${site}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}