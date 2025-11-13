import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

// Configure Google OAuth Strategy  
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || !clientSecret) {
  console.warn('Google OAuth credentials not found. OAuth will not be available.');
} else {
  passport.use('google', new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL: '/api/auth/oauth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google Profile Data:', {
      id: profile.id,
      displayName: profile.displayName,
      name: profile.name,
      emails: profile.emails,
      photos: profile.photos,
      provider: profile.provider,
      raw: profile._raw,
      json: profile._json
    });
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email (link accounts)
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ username: email });
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.displayName = profile.displayName;
        user.firstName = profile.name?.givenName;
        user.lastName = profile.name?.familyName;
        user.profilePicture = profile.photos?.[0]?.value;
        user.emailVerified = profile.emails?.[0]?.verified || false;
        await user.save();
        return done(null, user);
      }
    }
    
    // Create new user
    user = new User({
      username: email || `google_${profile.id}`,
      googleId: profile.id,
      role: 'customer',
      displayName: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      profilePicture: profile.photos?.[0]?.value,
      email: email,
      emailVerified: profile.emails?.[0]?.verified || false
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
  }));
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

export default passport;