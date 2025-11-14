import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './models/User';
import { Product } from './models/Product';

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // 1) Users
  const existingUser = await User.findOne({ username: 'standard' });
  if (!existingUser) {
    await User.create({
      username: 'standard',
      passwordHash: 'secret',
      role: 'customer',
    });
    console.log('Created user: standard / secret');
  } else {
    console.log('User "standard" already exists');
  }

  const existingUser1 = await User.findOne({ username: 'user1' });
  if (!existingUser1) {
    await User.create({
      username: 'user1',
      passwordHash: 'pass123',
      role: 'customer',
    });
    console.log('Created user: user1 / pass123');
  } else {
    console.log('User "user1" already exists');
  }

  // 2) Products
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: 'Red T-Shirt', price: 49.99 },
      { name: 'Blue Hoodie', price: 129.99 },
      { name: 'Sneakers',   price: 299.0 },
    ]);
    console.log('Seeded products collection');
  } else {
    console.log(`Products already seeded (count=${count})`);
  }

  await mongoose.disconnect();
  console.log('Seed done, connection closed');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
