import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './models/User';
import { Product } from './models/Product';

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // 1) User
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
