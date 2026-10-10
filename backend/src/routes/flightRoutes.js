const express = require('express');
const router = express.Router();
const amadeusService = require('../services/amadeusService');
const aviationstackService = require('../services/aviationstackService');
const trackingService = require('../services/trackingService');

const IATA_REGEX = /^[A-Za-z]{3}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/flights/search
 * Search available flight offers
 */
router.get('/search', async (req, res, next) => {
  try {
    const { origin, destination, date, adults } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query parameters "origin" (3-letter IATA), "destination" (3-letter IATA), and "date" (YYYY-MM-DD) are required.'
      });
    }

    if (!IATA_REGEX.test(origin.trim()) || !IATA_REGEX.test(destination.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Origin and destination must be valid 3-letter IATA airport codes (e.g. JFK, LHR, BOM).'
      });
    }

    if (!DATE_REGEX.test(date.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Date must be formatted as YYYY-MM-DD (e.g. 2026-10-15).'
      });
    }

    const offers = await amadeusService.searchFlights({
      origin: origin.trim(),
      destination: destination.trim(),
      date: date.trim(),
      adults: adults ? parseInt(adults, 10) : 1
    });

    res.status(200).json({
      success: true,
      count: offers.length,
      params: { origin: origin.toUpperCase(), destination: destination.toUpperCase(), date },
      data: offers
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/flights/:flightNumber/status
 * Retrieve real-time or scheduled flight status
 */
router.get('/:flightNumber/status', async (req, res, next) => {
  try {
    const { flightNumber } = req.params;

    if (!flightNumber || flightNumber.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid flight number (e.g. BA142, AI645) is required.'
      });
    }

    const status = await aviationstackService.getFlightStatus(flightNumber);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/flights/:flightNumber/position
 * Retrieve live aircraft radar telemetry (lat/lon/heading/altitude)
 */
router.get('/:flightNumber/position', async (req, res, next) => {
  try {
    const { flightNumber } = req.params;

    if (!flightNumber || flightNumber.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid flight number is required.'
      });
    }

    const position = await trackingService.getAircraftPosition(flightNumber);

    if (!position.available) {
      return res.status(200).json({
        success: true,
        available: false,
        data: position
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      data: position
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
