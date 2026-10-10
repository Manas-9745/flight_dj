const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');

/**
 * GET /api/flights/stats
 * Global aviation stats (active flights, airlines, disruptions)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await statsService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/flights/live
 * Live aircraft positions (viewport-bounded to avoid loading all ~10k records)
 * Query params: minLat, minLon, maxLat, maxLon (optional bbox)
 */
router.get('/live', async (req, res, next) => {
  try {
    const { minLat, minLon, maxLat, maxLon } = req.query;

    let bbox = null;
    if (minLat && minLon && maxLat && maxLon) {
      bbox = {
        minLat: parseFloat(minLat),
        minLon: parseFloat(minLon),
        maxLat: parseFloat(maxLat),
        maxLon: parseFloat(maxLon)
      };
    }

    const result = await statsService.getLiveFlights(bbox);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
