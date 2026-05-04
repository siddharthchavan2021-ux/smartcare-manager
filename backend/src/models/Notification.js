const mongoose = require('mongoose');

/**
 * Notification model — mirrors Java Notification.java exactly.
 *
 * Types:
 *   APPOINTMENT_BOOKED    → doctor receives when patient books
 *   APPOINTMENT_CONFIRMED → patient receives when doctor confirms
 *   APPOINTMENT_CANCELLED → patient receives when doctor rejects
 *   APPOINTMENT_REMINDER  → patient receives day before appointment
 *   PATIENT_CHECKED_IN    → doctor receives when patient checks in at kiosk
 */
const notificationSchema = new mongoose.Schema(
  {
    userId:          { type: String, required: true, index: true },
    type:            String,
    title:           String,
    message:         String,
    appointmentId:   String,
    relatedUserName: String,
    read:            { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
