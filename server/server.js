// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
// Critical: Configure CORS to accept requests from your React app
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true // Required for sending session cookies back and forth
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Essential for parsing incoming JSON payloads

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Set to true if using HTTPS
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Start the scheduler
const { scheduleEmailReminders } = require('./schedulers/emailReminders');
scheduleEmailReminders();

// Import and use Auth Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Import and use Transaction Routes <---
app.use('/api/transactions', require('./routes/transactions'));

// Import and use Goal Routes
app.use('/api/goals', require('./routes/goals'));

// Import and use Reminder Routes
app.use('/api/reminders', require('./routes/reminders'));

// Portfolio holdings and live stock data
app.use('/api/portfolio', require('./routes/portfolio'));

// AI assistant conversations and Gemini chat responses
app.use('/api/ai', require('./routes/aiChat'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
