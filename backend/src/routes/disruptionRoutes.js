const express = require('express');
const router = express.Router();
const disruptionManagerService = require('../services/disruptionManagerService');
const { authenticateUser } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All disruption management routes apply authentication middleware (with demo fallback)
router.use(authenticateUser);

/**
 * GET /api/disruptions/monitoring
 * Check saved flights for real-time cancellations, delays, and downstream risks
 */
router.get('/monitoring', apiLimiter, async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo-user-1';
    const result = await disruptionManagerService.monitorUserTrips(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/disruptions/alternatives
 * Find and rank alternative flights for the disrupted route
 */
router.post('/alternatives', apiLimiter, async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      travelDate,
      disruptedFlightNumber,
      disruptedAirline,
      delayMinutes,
      disruptionType,
      originalFare
    } = req.body;

    const result = await disruptionManagerService.findAlternativeFlights({
      origin,
      destination,
      travelDate,
      disruptedFlightNumber,
      disruptedAirline,
      delayMinutes,
      disruptionType,
      originalFare
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/disruptions/impact
 * Whole-itinerary impact engine (connecting flights, hotel check-ins, ground transport, events)
 */
router.post('/impact', apiLimiter, async (req, res, next) => {
  try {
    const { tripId, flightNumber, delayMinutes, status, downstreamItems, language } = req.body;

    const result = await disruptionManagerService.analyzeWholeJourneyImpact({
      tripId,
      flightNumber,
      delayMinutes: parseInt(delayMinutes, 10) || 0,
      status: status || 'delayed',
      downstreamItems,
      language: language || 'en'
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/disruptions/propose
 * Generate before-and-after proposed recovery itinerary
 */
router.post('/propose', apiLimiter, async (req, res, next) => {
  try {
    const { originalTrip, selectedAlternative, downstreamItems } = req.body;

    if (!originalTrip || !selectedAlternative) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Both originalTrip and selectedAlternative are required.'
      });
    }

    const result = await disruptionManagerService.prepareProposedItinerary({
      originalTrip,
      selectedAlternative,
      downstreamItems
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/disruptions/apply
 * User approves the revised itinerary; updates saved trip and logs audit trail
 */
router.post('/apply', apiLimiter, async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo-user-1';
    const { tripId, newFlight, approvalNote } = req.body;

    if (!tripId || !newFlight) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'tripId and newFlight are required.'
      });
    }

    const result = await disruptionManagerService.applyItineraryUpdate({
      userId,
      tripId,
      newFlight,
      approvalNote
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/disruptions/dismiss
 * Dismiss an active disruption alert
 */
router.post('/dismiss', apiLimiter, async (req, res, next) => {
  try {
    const { alertId } = req.body;
    res.status(200).json({
      success: true,
      data: {
        dismissedAlertId: alertId,
        message: 'Disruption alert dismissed successfully.'
      }
    });
  } catch (err) {
    next(err);
  }
});

const hotelRecommendationService = require('../services/hotelRecommendationService');

/**
 * POST /api/disruptions/hotels
 * Retrieve nearby location-aware demo hotels during flight disruptions
 */
router.post('/hotels', apiLimiter, async (req, res, next) => {
  try {
    const { trip, disruption, downstreamItems, nights, checkInDate, filters } = req.body;

    const result = hotelRecommendationService.getNearbyHotelRecommendations({
      trip,
      disruption,
      downstreamItems,
      nights: nights || 1,
      checkInDate,
      filters: filters || {}
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
