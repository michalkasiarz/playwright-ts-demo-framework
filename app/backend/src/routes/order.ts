import { Router } from 'express';
import { publishOrderCreated } from '../rabbitmq/publisher';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order and publish OrderCreated event to RabbitMQ
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: demo-user
 *               total:
 *                 type: number
 *                 example: 100.0
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [{ productId: "abc123", quantity: 2 }]
 *     responses:
 *       201:
 *         description: Order created and event published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *       500:
 *         description: Order created but failed to publish event
 */
router.post('/', async (req, res) => {
  // Simulate order creation
  const order = {
    orderId: Math.random().toString(36).substring(2, 10),
    userId: req.body.userId || 'demo-user',
    total: req.body.total || 100.0,
    products: req.body.products || [],
    createdAt: new Date().toISOString()
  };

  // save the order to the database

  // Publish event to RabbitMQ
  try {
    await publishOrderCreated(order);
    res.status(201).json({ message: 'Order created and event published', order });
  } catch (err) {
    res.status(500).json({ message: 'Order created but failed to publish event', error: err });
  }
});

export default router;
