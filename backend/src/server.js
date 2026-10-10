const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const arinaRoutes = require('./routes/arinaRoutes');
// Middlewares
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const flightRoutes = require('./routes/flightRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const tripRoutes = require('./routes/tripRoutes');
const statsRoutes = require('./routes/statsRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const alertRoutes = require('./routes/alertRoutes');
const disruptionRoutes = require('./routes/disruptionRoutes');
const quickHelpRoutes = require('./routes/quickHelpRoutes');

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
app.use('/api/flights', statsRoutes);    // stats & live BEFORE parameterized routes
app.use('/api/flights', flightRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/assistant', journeyRoutes); // transfer, impact, baggage, hold-check
app.use('/api/trips', tripRoutes);
app.use('/api/alerts', alertRoutes);      // Feature 11: Live Crisis & Aviation Alerts
app.use('/api/disruptions', disruptionRoutes); // Disruption Manager & Recovery

app.use('/api/quick-help', quickHelpRoutes);
app.use('/api/arina', arinaRoutes);

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
  Stats:       http://localhost:${PORT}/api/flights/stats
  Live Map:    http://localhost:${PORT}/api/flights/live
  Flights:     http://localhost:${PORT}/api/flights/search
  Status:      http://localhost:${PORT}/api/flights/:flightNumber/status
  Radar:       http://localhost:${PORT}/api/flights/:flightNumber/position
  Assistant:   http://localhost:${PORT}/api/assistant/chat
  Transfer:    http://localhost:${PORT}/api/assistant/transfer
  Impact:      http://localhost:${PORT}/api/assistant/impact
  Baggage:     http://localhost:${PORT}/api/assistant/baggage
  Hold Check:  http://localhost:${PORT}/api/assistant/hold-check
  Trips:       http://localhost:${PORT}/api/trips
=============================================================
    `);
  });
}

module.exports = app;
