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
const statsRoutes = require('./routes/statsRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const alertRoutes = require('./routes/alertRoutes');
const disruptionRoutes = require('./routes/disruptionRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration supporting local machine, LAN mobile devices, and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, server-to-server, or same-origin
  if (allowedOrigins.includes(origin)) return true;
  // Allow any LAN subnet for phone development over Wi-Fi
  // 10.x.x.x, 192.168.x.x, 172.16.x.x - 172.31.x.x
  const lanRegex = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
  return lanRegex.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
app.use('/api/wallet', walletRoutes);          // Secure Travel Wallet & Documents

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
=============================================================
  ✈️  AeroMate (PS-01) Backend Service Active
=============================================================
  Network:     http://0.0.0.0:${PORT} (LAN accessible)
  Local:       http://localhost:${PORT}
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
