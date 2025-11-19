import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './models/User';

async function clearUsers() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for clearing users');

  // Delete all users except admin
  const result = await User.deleteMany({ 
    email: { $ne: 'admin@example.com' },
    username: { $ne: 'admin' }
  });
  
  console.log(`✅ Deleted ${result.deletedCount} users, kept admin account`);
  
  // Show remaining users
  const remainingUsers = await User.find({}, 'username email role');
  console.log('Remaining users:', remainingUsers);

  await mongoose.disconnect();
  console.log('Clear users done, connection closed');
}

clearUsers().catch(err => {
  console.error(err);
  process.exit(1);
});