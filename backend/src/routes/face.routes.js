const express = require('express');
const router = express.Router();
const faceController = require('../controllers/face.controller');
const authMiddleware = require('../middleware/auth');

// Public kiosk check-in (no JWT required)
router.post('/checkin', faceController.kioskCheckin);

// Patient face endpoints (JWT required)
router.post('/enroll', authMiddleware, faceController.enrollFace);
router.get('/status', authMiddleware, faceController.getFaceStatus);

module.exports = router;
