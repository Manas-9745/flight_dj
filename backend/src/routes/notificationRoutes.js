const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/preferences', async (req, res, next) => {
  try {
    const data = await notificationService.getPreferences(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const data = await notificationService.updatePreferences(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const data = await notificationService.getHistory(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
