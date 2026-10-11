const express = require('express');
const router = express.Router();
const profileService = require('../services/profileService');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', async (req, res, next) => {
  try {
    const data = await profileService.getProfile(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const data = await profileService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
