const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); 
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      // "https://t4bnhxfl-5173.inc1.devtunnels.ms",
      "https://interview-ai-project.netlify.app/",
    ], // Frontend URL
    credentials: true, // Allow cookies to be sent
  }),
);

// Require all the routes here
const authRoutes = require('./routes/auth.routes');
const interviewRoutes = require('./routes/interview.routes');

// using all the routes here
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

module.exports = app;

