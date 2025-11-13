import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import passwordRoutes from './password';

const router = Router();

// Mount auth method routes
router.use('/password', passwordRoutes);

// Shared endpoints
router.get('/me', requireAuth, (req, res) => {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ username: user.username, role: user.role });
});

export default router;