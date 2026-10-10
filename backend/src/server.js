const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Middlewares
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const flightRoutes = require('./routes/flightRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing
app.use(helmet());
app.use(cors({
  origin: '*', // Adjust in production to frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use('/api/', apiLimiter);

// API Route Mounts
app.use('/api', healthRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/trips', tripRoutes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
=============================================================
  ✈️  AeroMate (PS-01) Backend Service Active
=============================================================
  Port:        http://localhost:${PORT}
  Health:      http://localhost:${PORT}/api/health
  Flights:     http://localhost:${PORT}/api/flights/search
  Status:      http://localhost:${PORT}/api/flights/:flightNumber/status
  Radar:       http://localhost:${PORT}/api/flights/:flightNumber/position
  Assistant:   http://localhost:${PORT}/api/assistant/chat
  Trips:       http://localhost:${PORT}/api/trips
=============================================================
    `);
  });
}

module.exports = app;
