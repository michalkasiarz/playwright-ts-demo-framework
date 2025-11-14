import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String }, // Optional for OAuth-only users
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  
  // OAuth fields
  googleId: { type: String },
  githubId: { type: String },
  
  // Google profile data
  displayName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  profilePicture: { type: String },
  email: { type: String },
  emailVerified: { type: Boolean },
  
  // TOTP fields
  totpSecret: { type: String },
  totpEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export const User = model('User', userSchema);
