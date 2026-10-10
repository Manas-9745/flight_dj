const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'AeroMate Backend API',
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  });
});

module.exports = router;
