import amqp, { ConsumeMessage } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'order_created';

async function startWorker() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`Worker is listening to queue: ${QUEUE}`);

    channel.consume(QUEUE, (msg: ConsumeMessage | null) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log('Receiver OrderCreated:', order);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Worker error:', err);
    process.exit(1);
  }
}

startWorker();
