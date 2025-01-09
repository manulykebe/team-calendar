import { Router } from 'express';
import { readSiteData } from '../utils';

const router = Router();

router.get('/:site', async (req, res) => {
  try {
    const siteData = await readSiteData(req.params.site);
    res.json(siteData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch site data' });
  }
});

export { router as sitesRouter };