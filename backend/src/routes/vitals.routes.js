const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitals.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/sync', vitalsController.syncVitals);
router.get('/latest', vitalsController.getLatestVitals);
router.get('/history', vitalsController.getVitalsHistory);

module.exports = router;
