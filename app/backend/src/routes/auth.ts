import { Router } from 'express';
import { signToken } from '../auth/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import passport from '../config/passport';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email/username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
// Password-based login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginField = email || username;

    if (!loginField || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Find user by email OR username for compatibility
    const user = await User.findOne({ 
      $or: [
        { email: loginField },
        { username: loginField }
      ]
    });
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = password === user.passwordHash;
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if TOTP is enabled for this user
    if (user.totpEnabled && user.totpSecret) {
      // User has TOTP enabled - require TOTP verification
      return res.status(200).json({
        requiresTotp: true,
        message: 'TOTP verification required',
        userId: user._id.toString() // Temp identifier for TOTP login
      });
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
      user: { 
        id: user._id.toString(),
        email: user.email || user.username + '@demo.local',
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        authMethods: ['password'],
        totpEnabled: !!user.totpSecret
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/oauth/google:
 *   get:
 *     summary: Start Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
// OAuth Routes (only if credentials available)
router.get('/oauth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    // Mock OAuth flow - redirect to mock Google page
    const state = Math.random().toString(36).substring(7);
    const isLinking = req.session.linkingUserId ? '&linking=true' : '';
    return res.redirect(`/mock-google-auth?state=${state}${isLinking}`);
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'consent'
  })(req, res);
});

// OAuth callback for BOTH login and linking
router.get('/oauth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    return res.redirect('http://localhost:3001/login-failed');
  }
  
  passport.authenticate('google', { failureRedirect: '/login-failed' })(req, res, async () => {
    try {
      const oauthUser = req.user as any;
      console.log('🔍 OAuth success - User:', oauthUser.displayName);
      console.log('🔍 Session linkingUserId:', req.session.linkingUserId);
      console.log('🔍 Is Linking Mode?', !!req.session.linkingUserId);
      
      // Check if this is account linking (existing user)
      if (req.session.linkingUserId) {
        console.log('🔗 LINKING MODE - Looking for user:', req.session.linkingUserId);
        const existingUser = await User.findById(req.session.linkingUserId);
        
        if (existingUser) {
          console.log('✅ Found existing user:', existingUser.displayName);
          // Link Google account to existing user - preserve existing profile data
          
          existingUser.googleId = oauthUser.googleId;
          
          // Only update profile data if not already set (new accounts)
          if (!existingUser.displayName) {
            existingUser.displayName = oauthUser.displayName;
          }
          if (!existingUser.firstName) {
            existingUser.firstName = oauthUser.firstName;
          }
          if (!existingUser.lastName) {
            existingUser.lastName = oauthUser.lastName;
          }
          if (!existingUser.profilePicture) {
            existingUser.profilePicture = oauthUser.profilePicture;
          }
          
          // Update email if not set
          if (!existingUser.email) {
            existingUser.email = oauthUser.email;
          }
          
          await existingUser.save();
          
          // Clear linking session
          delete req.session.linkingUserId;
          
          // Redirect back to dashboard
          return res.redirect('/');
        }
      }
      
      // Regular OAuth login (new user or existing OAuth user)
      const user = oauthUser;
      
      // Generate JWT for OAuth user
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
      res.redirect(`http://localhost:3001/login-success?email=${encodeURIComponent(googleEmail)}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('http://localhost:3001/login-failed');
    }
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user info
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User info
 *       401:
 *         description: Unauthorized
 */
// Get current user info
router.get('/me', requireAuth, async (req, res) => {
  console.log('=== /me endpoint called ===');
  try {
    const jwtUser = (req as AuthenticatedRequest).user!;
    console.log('JWT User:', jwtUser);
    const userId = jwtUser.sub; // JWT subject is user ID
    console.log('Looking for user ID:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const response = {
      id: user._id.toString(),
      email: user.email || user.username + '@demo.local',
      name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      authMethods: ['password'],
      totpEnabled: user.totpEnabled || false,  // Use explicit field, not secret presence
      googleLinked: !!user.googleId // Check if Google account is linked
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed user info including OAuth data
/**
 * @swagger
 * /api/auth/user-info:
 *   get:
 *     summary: Get detailed user info including OAuth data
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Detailed user info
 *       401:
 *         description: Unauthorized
 */
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
      totpEnabled: true,
      user: { 
        id: user._id.toString(),
        email: user.email || user.username + '@demo.local',
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        authMethods: ['password', 'totp'],
        totpEnabled: true
      }
    });
  } catch (error) {
    console.error('TOTP verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TOTP Disable - Disable TOTP for authenticated user
router.post('/totp/disable', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.totpEnabled) {
      return res.status(400).json({ 
        error: 'TOTP is not enabled',
        message: 'TOTP is already disabled for this account.' 
      });
    }

    // Disable TOTP
    user.totpEnabled = false;
    user.totpSecret = undefined; // Clear the secret
    await user.save();

    res.json({ 
      message: 'TOTP disabled successfully',
      totpEnabled: false
    });
  } catch (error) {
    console.error('TOTP disable error:', error);
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

// TOTP Verify Login - Verify TOTP token for already password-authenticated user
router.post('/totp/verify-login', async (req, res) => {
  try {
    const { userId, totpToken } = req.body;

    if (!userId || !totpToken) {
      return res.status(400).json({ 
        error: 'User ID and TOTP token are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      user: { 
        id: user._id.toString(),
        email: user.email || user.username + '@demo.local',
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        authMethods: ['password', 'totp'],
        totpEnabled: user.totpEnabled || false
      }
    });
  } catch (error) {
    console.error('TOTP verify login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Link Google Account to existing authenticated user
router.get('/oauth/google/link', requireAuth, (req, res) => {
  console.log('🔗 LINK START - Setting session data');
  console.log('🔗 User ID:', (req as AuthenticatedRequest).user!.sub);
  
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'mock-client-id') {
    // Mock OAuth flow for linking
    const state = Math.random().toString(36).substring(7);
    req.session.linkingUserId = (req as AuthenticatedRequest).user!.sub;
    req.session.isLinking = true;
    console.log('🔗 MOCK - Session set:', req.session.linkingUserId);
    return res.redirect(`/mock-google-auth?state=${state}&linking=true`);
  }
  
  // Store user ID in session for linking after OAuth
  req.session.linkingUserId = (req as AuthenticatedRequest).user!.sub;
  req.session.isLinking = true; // Flag for callback
  console.log('🔗 REAL OAUTH - Session set:', req.session.linkingUserId);
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'consent'
  })(req, res);
});

// Mock Google OAuth callback (for development/testing)
/**
 * @swagger
 * /api/auth/oauth/google/callback/mock:
 *   get:
 *     summary: Mock Google OAuth callback (dev only)
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: googleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to dashboard or login-success
 */
router.get('/oauth/google/callback/mock', async (req, res) => {
  try {
    const { email, name, googleId } = req.query;
    
    if (!email || !name || !googleId) {
      return res.redirect('http://localhost:3001/login-failed');
    }

    // Check if this is account linking (existing user)
    if (req.session.linkingUserId) {
      const existingUser = await User.findById(req.session.linkingUserId);
      
      if (existingUser) {
        // Link Google account to existing user - preserve existing profile data
        existingUser.googleId = googleId as string;
        
        // Only update profile data if not already set (new accounts)
        if (!existingUser.displayName) {
          existingUser.displayName = name as string;
        }
        if (!existingUser.firstName) {
          existingUser.firstName = (name as string).split(' ')[0];
        }
        if (!existingUser.lastName) {
          existingUser.lastName = (name as string).split(' ').slice(1).join(' ');
        }
        
        // Update email if not set
        if (!existingUser.email) {
          existingUser.email = email as string;
        }
        
        await existingUser.save();
        
        // Clear linking session
        delete req.session.linkingUserId;
        
        // Redirect back to dashboard
        return res.redirect('http://localhost:3001/');
      }
    }

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: googleId as string });
    
    if (user) {
      // Existing Google user - just login
    } else {
      // Check if user exists with same email (auto-link)
      user = await User.findOne({ email: email as string });
      if (user) {
        // Link Google account to existing email user
        user.googleId = googleId as string;
        user.displayName = name as string;
        user.firstName = (name as string).split(' ')[0];
        user.lastName = (name as string).split(' ').slice(1).join(' ');
        await user.save();
      } else {
        // Create new user
        user = new User({
          username: email as string,
          googleId: googleId as string,
          role: 'customer',
          displayName: name as string,
          firstName: (name as string).split(' ')[0],
          lastName: (name as string).split(' ').slice(1).join(' '),
          email: email as string,
          emailVerified: true
        });
        
        await user.save();
      }
    }
    
    // Generate JWT for OAuth user
    const token = signToken({
      sub: user._id.toString(),
      username: user.username,
      role: user.role
    });

    // Set JWT cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to success
    res.redirect('http://localhost:3001/login-success?email=' + encodeURIComponent(email as string));
  } catch (error) {
    console.error('Mock OAuth callback error:', error);
    res.redirect('http://localhost:3001/login-failed');
  }
});

// Unlink Google Account from authenticated user
router.post('/oauth/google/unlink', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ 
        error: 'Google account not linked',
        message: 'No Google account is currently linked to this user' 
      });
    }

    // Remove Google data but keep the account
    user.googleId = undefined;
    user.displayName = undefined;
    user.firstName = undefined;
    user.lastName = undefined;
    user.profilePicture = undefined;
    // Keep email if it was set
    
    await user.save();

    res.json({ 
      message: 'Google account unlinked successfully',
      googleLinked: false
    });
  } catch (error) {
    console.error('Google unlink error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DEVELOPMENT ONLY: Clear all users except admin
// Dev endpoint to delete specific user by ID (no auth required)
router.delete('/dev/users/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: result ? 'User deleted' : 'User not found'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/dev/clear-users:
 *   post:
 *     summary: Delete all users (dev only)
 *     tags: [Dev]
 *     responses:
 *       200:
 *         description: All users deleted
 */
router.post('/dev/clear-users', async (req, res) => {
  try {
    // Delete ALL users including admin for fresh start
    const result = await User.deleteMany({});
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} users, database cleared completely` 
    });
  } catch (error) {
    console.error('Clear users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dev endpoint to check all users (no auth required)
/**
 * @swagger
 * /api/auth/dev/users:
 *   get:
 *     summary: List all users (dev only)
 *     tags: [Dev]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/dev/users', async (req, res) => {
  try {
    const users = await User.find({}, { 
      email: 1, 
      username: 1, 
      displayName: 1, 
      googleId: 1, 
      role: 1 
    });
    
    res.json({ 
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
