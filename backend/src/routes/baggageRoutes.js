const express = require('express');
const router = express.Router();
const baggageService = require('../services/baggageService');
const { authenticateUser } = require('../middleware/auth');

// All baggage endpoints require user authentication
router.use(authenticateUser);

/**
 * GET /api/baggage
 * List all bags for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await baggageService.getUserBaggage(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/baggage
 * Register a new checked bag
 */
router.post('/', async (req, res, next) => {
  try {
    const data = await baggageService.registerBaggage(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/baggage/:id
 * Get single bag with status timeline and history
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await baggageService.getBaggageById(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/baggage/:id/status
 * Update status with timestamp, location, and source
 */
router.post('/:id/status', async (req, res, next) => {
  try {
    const data = await baggageService.updateStatus(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/baggage/:id/simulate
 * Advance baggage in Demo Mode to the next journey status
 */
router.post('/:id/simulate', async (req, res, next) => {
  try {
    const data = await baggageService.simulateNextStep(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/baggage/:id/recovery-report
 * Submit delayed, misrouted, or missing baggage incident report
 */
router.post('/:id/recovery-report', async (req, res, next) => {
  try {
    const data = await baggageService.submitRecoveryReport(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/baggage/:id/recovery-status
 * Update Property Irregularity Report (PIR) and recovery progress
 */
router.put('/:id/recovery-status', async (req, res, next) => {
  try {
    const data = await baggageService.updateRecoveryStatus(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/baggage/:id
 * Remove baggage record
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await baggageService.deleteBaggage(req.user.id, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
