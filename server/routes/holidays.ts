import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get('/:year', async (req, res) => {
  try {
    const filePath = join(__dirname, '../data/holidays.json');
    const data = await readFile(filePath, 'utf-8');
    const holidays = JSON.parse(data);
    
    const year = req.params.year;
    if (!holidays.BE[year]) {
      return res.status(404).json({ message: `No holidays found for year ${year}` });
    }
    
    res.json(holidays.BE[year]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch holidays' });
  }
});

export { router as holidaysRouter };