import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';

const app = express();

const MONGODB_URI = process.env.MONGODB_URI!;
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files for testing
app.use(express.static('.'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
  
  server.on('error', (error) => {
    console.error('Server error:', error);
  });
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

start();
