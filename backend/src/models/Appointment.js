const mongoose = require('mongoose');

/**
 * Appointment model — mirrors Java Appointment.java exactly.
 *
 * Status flow:
 *   Patient books    → PENDING
 *   Doctor confirms  → CONFIRMED
 *   Doctor rejects   → CANCELLED
 *   Patient checks in (kiosk face scan) → CHECKED_IN
 *   Doctor completes → COMPLETED
 *   Patient cancels  → CANCELLED (only if PENDING or CONFIRMED)
 */
const appointmentSchema = new mongoose.Schema(
  {
    // Patient info
    patientId:    { type: String, required: true, index: true },
    patientName:  String,
    patientEmail: String,

    // Doctor info
    doctorId:       { type: String, required: true, index: true },
    doctorName:     String,
    specialization: String,

    // Appointment details
    date:     String,   // e.g. "2026-03-15"
    timeSlot: String,   // e.g. "10:30 AM"
    reason:   String,

    // Status: PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED
    status:     { type: String, default: 'PENDING' },
    doctorNote: String,

    // Set when patient checks in via face kiosk
    checkedInAt: Date,
  },
  { timestamps: { createdAt: 'createdAt' } }
);

module.exports = mongoose.model('Appointment', appointmentSchema, 'appointments');
