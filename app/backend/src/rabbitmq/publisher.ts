// Publishes OrderCreated event to RabbitMQ
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
const QUEUE = 'order_created';

export async function publishOrderCreated(order: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(order)), { persistent: true });
  await channel.close();
  await connection.close();
}

// Example usage:
// publishOrderCreated({ orderId: '123', userId: '456', total: 99.99 });
