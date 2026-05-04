const Appointment = require('../models/Appointment');
const User = require('../models/User');
const notificationService = require('../services/notification.service');

const ALL_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM'
];

const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED'];

const bookAppointment = async (req, res) => {
  try {
    const patientUser = await User.findOne({ email: req.user.email });
    if (!patientUser || patientUser.role.toUpperCase() !== 'PATIENT') {
      return res.status(403).json({ error: 'Only patients can book' });
    }

    const { doctorId, date, timeSlot, reason } = req.body;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate) || parsedDate < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ error: 'Past date not allowed or invalid format' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role.toUpperCase() !== 'DOCTOR') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const slotTaken = await Appointment.exists({
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'CANCELLED' }
    });

    if (slotTaken) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    const appt = await Appointment.create({
      patientId: patientUser._id,
      patientName: patientUser.name,
      patientEmail: patientUser.email,
      doctorId: doctor._id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      date,
      timeSlot,
      reason,
      status: 'PENDING'
    });

    await notificationService.notifyDoctorAppointmentBooked(appt);

    res.status(201).json(appt);
  } catch (error) {
    console.error('[SmartCare] Book Appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    let appointments;
    if (user.role.toUpperCase() === 'PATIENT') {
      appointments = await Appointment.find({ patientId: user._id }).sort({ createdAt: -1 });
    } else if (user.role.toUpperCase() === 'DOCTOR') {
      appointments = await Appointment.find({ doctorId: user._id }).sort({ date: 1, timeSlot: 1 });
    } else {
      appointments = await Appointment.find();
    }

    res.json(appointments);
  } catch (error) {
    console.error('[SmartCare] Get My Appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorNote } = req.body;
    
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (user.role.toUpperCase() === 'DOCTOR' && String(appt.doctorId) !== String(user._id)) {
      return res.status(403).json({ error: 'Not your appointment' });
    }

    if (!status) return res.status(400).json({ error: 'Status is required' });

    const newStatus = status.toUpperCase();
    const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
    
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(appt.status)) {
      return res.status(400).json({ error: 'Cannot update' });
    }

    appt.status = newStatus;
    if (doctorNote && doctorNote.trim()) {
      appt.doctorNote = doctorNote;
    }

    await appt.save();

    await notificationService.notifyPatientStatusChanged(appt);

    res.json(appt);
  } catch (error) {
    console.error('[SmartCare] Update Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (String(appt.patientId) !== String(user._id) && String(appt.doctorId) !== String(user._id)) {
      return res.status(403).json({ error: 'Not your appointment' });
    }

    if (appt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed' });
    }

    appt.status = 'CANCELLED';
    await appt.save();

    res.json({ message: 'Cancelled successfully' });
  } catch (error) {
    console.error('[SmartCare] Cancel Appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date required' });
    }

    const booked = await Appointment.find({
      doctorId,
      date,
      status: { $in: BLOCKING_STATUSES }
    });

    const bookedSlots = new Set(booked.map(a => a.timeSlot));

    const slots = ALL_SLOTS.map(slot => ({
      time: slot,
      available: !bookedSlots.has(slot)
    }));

    res.json(slots);
  } catch (error) {
    console.error('[SmartCare] Get Slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (user.role.toUpperCase() !== 'ADMIN' && String(appt.patientId) !== String(user._id) && String(appt.doctorId) !== String(user._id)) {
      return res.status(403).json({ error: 'Not your appointment' });
    }

    res.json(appt);
  } catch (error) {
    console.error('[SmartCare] Get Appointment By Id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  updateStatus,
  cancelAppointment,
  getAvailableSlots,
  getAppointmentById
};
