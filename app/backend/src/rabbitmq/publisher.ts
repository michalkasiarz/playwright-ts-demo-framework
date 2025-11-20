// Publishes OrderCreated event to RabbitMQ
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';

export async function publishOrderCreated(order: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('order_created', { durable: true });
  channel.sendToQueue('order_created', Buffer.from(JSON.stringify(order)), { persistent: true });
  await channel.close();
  await connection.close();
}

export async function publishOrderPaid(order: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('order_paid', { durable: true });
  channel.sendToQueue('order_paid', Buffer.from(JSON.stringify(order)), { persistent: true });
  await channel.close();
  await connection.close();
}

export async function publishOrderShipped(order: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('order_shipped', { durable: true });
  channel.sendToQueue('order_shipped', Buffer.from(JSON.stringify(order)), { persistent: true });
  await channel.close();
  await connection.close();
}

export async function publishUserRegistered(user: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('user_registered', { durable: true });
  channel.sendToQueue('user_registered', Buffer.from(JSON.stringify(user)), { persistent: true });
  await channel.close();
  await connection.close();
}

export async function publishProductAdded(product: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('product_added', { durable: true });
  channel.sendToQueue('product_added', Buffer.from(JSON.stringify(product)), { persistent: true });
  await channel.close();
  await connection.close();
}

// Example usage:
// publishOrderCreated({ orderId: '123', userId: '456', total: 99.99 });
// publishOrderPaid({ orderId: '123', userId: '456', paidAt: new Date().toISOString() });
// publishOrderShipped({ orderId: '123', shippedAt: new Date().toISOString() });
// publishUserRegistered({ userId: '456', email: 'user@example.com' });
// publishProductAdded({ productId: '789', name: 'New Product' });
