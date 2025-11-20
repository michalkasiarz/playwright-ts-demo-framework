import { Router } from 'express';
import { publishOrderCreated, publishOrderPaid, publishOrderShipped, publishUserRegistered, publishProductAdded } from '../rabbitmq/publisher';

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

/**
 * @swagger
 * /api/orders/paid:
 *   post:
 *     summary: Publish OrderPaid event to RabbitMQ
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               userId:
 *                 type: string
 *               paidAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: OrderPaid event published
 *       500:
 *         description: Failed to publish event
 */
router.post('/paid', async (req, res) => {
  const order = {
    orderId: req.body.orderId,
    userId: req.body.userId,
    paidAt: req.body.paidAt || new Date().toISOString()
  };
  try {
    await publishOrderPaid(order);
    res.status(201).json({ message: 'OrderPaid event published', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish event', error: err });
  }
});

/**
 * @swagger
 * /api/orders/shipped:
 *   post:
 *     summary: Publish OrderShipped event to RabbitMQ
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               shippedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: OrderShipped event published
 *       500:
 *         description: Failed to publish event
 */
router.post('/shipped', async (req, res) => {
  const order = {
    orderId: req.body.orderId,
    shippedAt: req.body.shippedAt || new Date().toISOString()
  };
  try {
    await publishOrderShipped(order);
    res.status(201).json({ message: 'OrderShipped event published', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish event', error: err });
  }
});

/**
 * @swagger
 * /api/orders/user-registered:
 *   post:
 *     summary: Publish UserRegistered event to RabbitMQ
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: UserRegistered event published
 *       500:
 *         description: Failed to publish event
 */
router.post('/user-registered', async (req, res) => {
  const user = {
    userId: req.body.userId,
    email: req.body.email
  };
  try {
    await publishUserRegistered(user);
    res.status(201).json({ message: 'UserRegistered event published', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish event', error: err });
  }
});

/**
 * @swagger
 * /api/orders/product-added:
 *   post:
 *     summary: Publish ProductAdded event to RabbitMQ
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: ProductAdded event published
 *       500:
 *         description: Failed to publish event
 */
router.post('/product-added', async (req, res) => {
  const product = {
    productId: req.body.productId,
    name: req.body.name
  };
  try {
    await publishProductAdded(product);
    res.status(201).json({ message: 'ProductAdded event published', product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish event', error: err });
  }
});
