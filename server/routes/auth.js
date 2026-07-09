const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); 

const router = express.Router();
// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Make sure this matches your authorized redirect URI in Google Cloud!
    callbackURL: '/auth/google/callback' 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if the user already exists in our database
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User exists, log them in
        return done(null, user);
      } else {
        // 2. User doesn't exist, create a new one using exact schema names
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          profileImage: profile.photos ? profile.photos[0].value : ''
        });
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
));

// Serialize & Deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- REST API ROUTES ---

// 1. Initiate Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google Callback Handler
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    // Successful authentication, redirect to React frontend dashboard
    res.redirect('http://localhost:5173/dashboard');
  }
);

// 3. Get Current Logged-In User (React will call this on load)
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
});

// 4. Logout Route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;