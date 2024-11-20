import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthRequest, BankHoliday } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const holidaysDir = path.join(__dirname, '../data/bank-holidays');

async function getBankHolidaysFile(country: string, year: string) {
  const filePath = path.join(holidaysDir, country.toLowerCase(), `${year}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { holidays: [] };
  }
}

export const getBankHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { country, year } = req.params;
    
    const { holidays } = await getBankHolidaysFile(country, year);
    res.json({ holidays });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};