import { Router } from 'express';
import { signToken } from '../auth/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import passport from '../config/passport';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

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
    scope: ['profile', 'email'],
    prompt: 'consent'
  })(req, res);
});

router.get('/oauth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    return res.redirect('/login-failed');
  }
  
  passport.authenticate('google', { failureRedirect: '/login-failed' })(req, res, async () => {
    try {
      const user = req.user as any;
      console.log('OAuth success - Full User object:', user);
      console.log('OAuth success - User email from DB:', user.email);
      console.log('OAuth success - User username:', user.username);
      
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

      // Redirect to success page with Google email parameter
      const googleEmail = user.email || user.username;
      res.redirect(`/login-success.html?email=${encodeURIComponent(googleEmail)}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login-failed.html');
    }
  });
});

// Get current user info
router.get('/me', requireAuth, (req, res) => {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ username: user.username, role: user.role });
});

// Get detailed user info including OAuth data
router.get('/user-info', requireAuth, async (req, res) => {
  try {
    console.log('User-info request - JWT payload:', (req as AuthenticatedRequest).user);
    const userId = (req as AuthenticatedRequest).user!.sub;
    console.log('Looking for user with ID:', userId);
    const user = await User.findById(userId).select('-passwordHash');
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userInfo = {
      id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authMethod: user.googleId ? 'google-oauth' : 'password',
      
      // OAuth data
      googleId: user.googleId || null,
      displayName: user.displayName || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profilePicture: user.profilePicture || null,
      email: user.email || null,
      emailVerified: user.emailVerified || false,
      
      // TOTP
      totpEnabled: user.totpEnabled || false
    };

    res.json(userInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TOTP Setup - Generate secret and QR code for user
router.post('/totp/setup', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.totpEnabled) {
      return res.status(400).json({ 
        error: 'TOTP already enabled',
        message: 'TOTP is already enabled for this account. Use /totp/disable to reset.' 
      });
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `DemoShop (${user.username})`,
      issuer: 'DemoShop Backend',
      length: 32
    });

    // Store the temporary secret (not enabled yet until verified)
    user.totpSecret = secret.base32;
    await user.save();

    // Generate QR code for the secret
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      issuer: 'DemoShop Backend',
      accountName: user.username,
      message: 'Scan the QR code with Google Authenticator or enter the manual key'
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TOTP Verify - Verify token and enable TOTP
router.post('/totp/verify', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = (req as AuthenticatedRequest).user!.sub;
    
    if (!token) {
      return res.status(400).json({ error: 'TOTP token is required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.totpSecret) {
      return res.status(400).json({ error: 'TOTP setup not found. Run setup first.' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance (30s each)
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid TOTP token' });
    }

    // Enable TOTP for the user
    user.totpEnabled = true;
    await user.save();

    res.json({ 
      message: 'TOTP enabled successfully',
      totpEnabled: true
    });
  } catch (error) {
    console.error('TOTP verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TOTP Login - Login with username/password + TOTP token
router.post('/totp/login', async (req, res) => {
  try {
    const { username, password, totpToken } = req.body;

    if (!username || !password || !totpToken) {
      return res.status(400).json({ 
        error: 'Username, password, and TOTP token are required' 
      });
    }

    // First verify username/password
    const user = await User.findOne({ username });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = password === user.passwordHash;
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if TOTP is enabled
    if (!user.totpEnabled || !user.totpSecret) {
      return res.status(400).json({ 
        error: 'TOTP not enabled for this account' 
      });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpToken,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid TOTP token' });
    }

    // Generate JWT token
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
      message: 'Login successful with 2FA',
      user: { username: user.username, role: user.role },
      totpVerified: true
    });
  } catch (error) {
    console.error('TOTP login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
