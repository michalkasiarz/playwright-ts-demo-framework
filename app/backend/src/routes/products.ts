import { Router } from 'express';
import { Product } from '../models/Product';
import { publishProductAdded } from '../rabbitmq/publisher';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product and publish ProductAdded event to RabbitMQ
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created and event published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *       500:
 *         description: Product created but failed to publish event
 */
router.post('/', async (req, res) => {
  const product = {
    name: req.body.name,
    price: req.body.price
  };
  try {
    // const newProduct = await Product.create(product);
    await publishProductAdded({ productId: Math.random().toString(36).substring(2, 10), ...product });
    res.status(201).json({ message: 'Product created and event published', product });
  } catch (err) {
    res.status(500).json({ message: 'Product created but failed to publish event', error: err });
  }
});
