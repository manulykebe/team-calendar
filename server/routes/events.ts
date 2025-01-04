import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/events';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const events = await getEvents(req.user!.site);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const event = await createEvent({
      ...req.body,
      userId: req.user!.id,
      site: req.user!.site
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const event = await updateEvent({
      id: req.params.id,
      ...req.body,
      userId: req.user!.id,
      site: req.user!.site
    });
    res.json(event);
  } catch (error) {
    res.status(403).json({ message: error instanceof Error ? error.message : 'Not authorized' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await deleteEvent({
      id: req.params.id,
      userId: req.user!.id,
      site: req.user!.site
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(403).json({ message: error instanceof Error ? error.message : 'Not authorized' });
  }
});

export { router as eventRouter };