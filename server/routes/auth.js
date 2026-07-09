const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust path if your User model is different

const router = express.Router();
// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in our db
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        return done(null, user);
      } else {
        // Create new user if they don't exist
        const newUser = new User({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          // You might need to adjust these fields based on your exact User.js schema
        });
        await newUser.save();
        return done(null, newUser);
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