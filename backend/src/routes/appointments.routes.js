const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointments.controller');
const authMiddleware = require('../middleware/auth');

// No auth required for available slots
router.get('/slots', appointmentsController.getAvailableSlots);

// Auth required
router.use(authMiddleware);
router.post('/', appointmentsController.bookAppointment);
router.get('/my', appointmentsController.getMyAppointments);
router.get('/:id', appointmentsController.getAppointmentById);
router.put('/:id/status', appointmentsController.updateStatus);
router.delete('/:id', appointmentsController.cancelAppointment);

module.exports = router;
