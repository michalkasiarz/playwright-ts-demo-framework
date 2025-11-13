import { Router } from 'express';
import { signToken } from '../auth/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import passport from '../config/passport';

const router = Router();

// Password-based login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = password === user.passwordHash;
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ 
      sub: user._id.toString(),
      username: user.username,
      role: user.role
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      message: 'Login successful',
      user: { username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth Routes (only if credentials available)
router.get('/oauth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    return res.status(503).json({ 
      error: 'Google OAuth not configured',
      message: 'Real Google OAuth credentials required' 
    });
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })(req, res);
});

router.get('/oauth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    return res.redirect('/login-failed');
  }
  
  passport.authenticate('google', { failureRedirect: '/login-failed' })(req, res, async () => {
    try {
      const user = req.user as any;
      
      // Generate JWT for OAuth user (optional - can use session instead)
      const token = signToken({
        sub: user._id.toString(),
        username: user.username,
        role: user.role
      });

      // Set JWT cookie (keeping consistent with password login)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to success page or app
      res.redirect('http://localhost:3000/login-success');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login-failed');
    }
  });
});

// Get current user info
router.get('/me', requireAuth, (req, res) => {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ username: user.username, role: user.role });
});

export default router;
