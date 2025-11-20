
import amqp, { ConsumeMessage } from 'amqplib';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import nodemailer from 'nodemailer';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'order_created';


async function startWorker() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Worker connected to MongoDB');

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`Worker is listening to queue: ${QUEUE}`);

    channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log('Receiver OrderCreated:', order);
        try {
          await Order.create(order);
          console.log('Order saved to MongoDB');

          // Wysyłka maila przez nodemailer (Mailtrap do testów)
          const transporter = nodemailer.createTransport({
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: {
              user: process.env.MAILTRAP_USER || 'MAILTRAP_USER',
              pass: process.env.MAILTRAP_PASS || 'MAILTRAP_PASS'
            }
          });

          await transporter.sendMail({
            from: 'Demo Shop <no-reply@demo.local>',
            to: 'test@example.com', // docelowo: order.email
            subject: 'Order confirmation',
            text: `Your order ${order.orderId} has been received
            !`,
            html: `<b>Your order ${order.orderId} has been received!</b>`
          });
          console.log('Confirmation email sent');
        } catch (err) {
          console.error('Error saving order or sending email:', err);
        }
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Worker error:', err);
    process.exit(1);
  }
}

startWorker();
