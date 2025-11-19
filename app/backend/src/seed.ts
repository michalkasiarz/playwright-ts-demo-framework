import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './models/User';
import { Product } from './models/Product';

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear users only, keep products
  await User.deleteMany({});
  console.log('Cleared all users');

  // Create ONLY admin user with displayName
  await User.create({
    username: 'admin',
    displayName: 'Demo Admin User',
    email: 'admin@example.com',
    passwordHash: 'password123',
    role: 'admin',
    totpEnabled: false,
    totpSecret: undefined
  });
  console.log('✅ Created admin user: admin@example.com / password123');
  console.log('✅ DisplayName set to: Demo Admin User');

  // Create products if not exist
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany([
      { name: 'Red T-Shirt', price: 49.99 },
      { name: 'Blue Hoodie', price: 129.99 },
      { name: 'Sneakers', price: 299.0 },
    ]);
    console.log('✅ Created products');
  } else {
    console.log(`✅ Products already exist (count=${productCount})`);
  }

  await mongoose.disconnect();
  console.log('Seed done, connection closed');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
