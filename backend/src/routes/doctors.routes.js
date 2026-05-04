const express = require('express');
const router = express.Router();
const doctorsController = require('../controllers/doctors.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', doctorsController.getAllDoctors);

module.exports = router;
