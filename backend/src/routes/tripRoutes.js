const express = require('express');
const router = express.Router();
const tripsService = require('../services/tripsService');
const { authenticateUser } = require('../middleware/auth');

// All trip routes require an authenticated user
router.use(authenticateUser);

/**
 * GET /api/trips
 * List the authenticated user's saved trips
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const trips = await tripsService.getUserTrips(userId);

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/trips
 * Save a trip for the authenticated user
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { flightNumber, airline, origin, destination, travelDate, status, metadata } = req.body;

    if (!flightNumber || !origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'flightNumber, origin, and destination are required.'
      });
    }

    const savedTrip = await tripsService.saveTrip(userId, {
      flightNumber,
      airline,
      origin,
      destination,
      travelDate,
      status,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Trip successfully saved.',
      data: savedTrip
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/trips/:id
 * Delete a saved trip by ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Trip ID is required in route parameters.'
      });
    }

    const result = await tripsService.deleteTrip(userId, tripId);

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
