const express = require('express');
const router = express.Router();
const journeyService = require('../services/journeyService');
const { aiAssistantLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/assistant/transfer
 * AI-powered airport transfer guide for a connecting journey
 */
router.post('/transfer', aiAssistantLimiter, async (req, res, next) => {
  try {
    const { inboundFlight, outboundFlight, language } = req.body;

    if (!inboundFlight || !outboundFlight) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Both inboundFlight and outboundFlight objects are required.'
      });
    }

    const result = await journeyService.getTransferGuide({
      inboundFlight,
      outboundFlight,
      language: language || 'en'
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assistant/impact
 * Journey impact analysis for a disrupted flight across a multi-leg itinerary
 */
router.post('/impact', aiAssistantLimiter, async (req, res, next) => {
  try {
    const { segments, disruption, language } = req.body;

    if (!disruption) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'disruption object is required (flightNumber, status, delayMinutes).'
      });
    }

    const result = await journeyService.analyzeImpact({
      segments: Array.isArray(segments) ? segments : [],
      disruption,
      language: language || 'en'
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assistant/baggage
 * Baggage guidance and assistance instructions
 */
router.post('/baggage', aiAssistantLimiter, async (req, res, next) => {
  try {
    const { flightNumber, airline, status, segments, language } = req.body;

    const result = await journeyService.getBaggageGuidance({
      flightNumber: flightNumber || null,
      airline: airline || null,
      status: status || 'unknown',
      segments: Array.isArray(segments) ? segments : [],
      language: language || 'en'
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assistant/hold-check
 * Consequences of postponing or holding a trip decision
 */
router.post('/hold-check', aiAssistantLimiter, async (req, res, next) => {
  try {
    const { currentTrip, proposedChange, language } = req.body;

    const result = await journeyService.getHoldConsequences({
      currentTrip: currentTrip || {},
      proposedChange: proposedChange || {},
      language: language || 'en'
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
