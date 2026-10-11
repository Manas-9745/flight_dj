const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', async (req, res, next) => {
  try {
    const data = await bookingService.getBookings(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.provider_booking_reference) return res.status(400).json({ success: false, error: 'provider_booking_reference required' });
    const data = await bookingService.addBooking(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = await bookingService.updateBooking(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await bookingService.deleteBooking(req.user.id, req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
