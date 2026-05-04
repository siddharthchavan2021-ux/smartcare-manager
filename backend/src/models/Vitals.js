const mongoose = require('mongoose');

/**
 * Vitals model — mirrors Java Vitals.java exactly.
 *
 * Data sources:
 *   "WATCH"  → pushed by SmartCare Companion Android app
 *   "MANUAL" → entered by patient through dashboard
 */
const vitalsSchema = new mongoose.Schema(
  {
    patientId:    { type: String, required: true, index: true },
    patientEmail: String,

    // Watch-measurable vitals
    heartRate:    Number,   // BPM
    spo2:         Number,   // SpO₂ percentage (e.g. 98)
    steps:        Number,   // daily step count
    sleepMinutes: Number,   // total sleep in minutes

    // Source & timing
    source:     String,   // "WATCH" or "MANUAL"
    recordedAt: Date,     // when the reading was taken on the device
  },
  { timestamps: { createdAt: 'createdAt' } }
);

module.exports = mongoose.model('Vitals', vitalsSchema, 'vitals');
