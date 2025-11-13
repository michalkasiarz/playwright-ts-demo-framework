import { Router } from 'express';
import { CartItem } from '../models/CartItem';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).user!.sub;
  const items = await CartItem.find({ userId }).lean();
  res.json(items);
});

router.post('/', async (req, res) => {
  const userId = (req as AuthenticatedRequest).user!.sub;
  const { productId, quantity } = req.body ?? {};

  if (!productId || !quantity) {
    return res.status(400).json({ message: 'productId and quantity are required' });
  }

  const existing = await CartItem.findOne({ userId, productId });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
    return res.status(200).json(existing);
  }

  const item = await CartItem.create({ userId, productId, quantity });
  res.status(201).json(item);
});

export default router;
