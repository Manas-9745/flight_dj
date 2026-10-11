const express = require('express');
const router = express.Router();
const passengerService = require('../services/passengerService');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', async (req, res, next) => {
  try {
    const data = await passengerService.getPassengers(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.passenger_name) return res.status(400).json({ success: false, error: 'passenger_name required' });
    const data = await passengerService.addPassenger(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = await passengerService.updatePassenger(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await passengerService.deletePassenger(req.user.id, req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
