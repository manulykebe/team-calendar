import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { getUsers, createUser, updateUser, deleteUser } from '../services/users';

const router = Router();

router.use(authenticateToken);

// Get all users for the current site
router.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await getUsers(req.user!.site);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await createUser({
      ...req.body,
      site: req.user!.site
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create user' });
  }
});

// Update a user
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await updateUser(req.params.id, {
      ...req.body,
      site: req.user!.site
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update user' });
  }
});

// Delete a user
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await deleteUser(req.params.id, req.user!.site);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete user' });
  }
});

export { router as userRouter };