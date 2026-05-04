const mongoose = require('mongoose');

/**
 * OtpEntry model — mirrors Java OtpEntry.java exactly.
 *
 * Flow:
 *  1. User submits registration form
 *  2. Account saved with enabled=false
 *  3. OTP generated → stored here → emailed to user
 *  4. User enters OTP on verify page
 *  5. OTP matched → User.enabled = true → can login
 *  6. Document auto-deleted by MongoDB TTL after 5 minutes
 */
const otpEntrySchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code:  { type: String, required: true },
  // TTL index — MongoDB deletes this document 300 seconds (5 min) after creation
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

module.exports = mongoose.model('OtpEntry', otpEntrySchema, 'otp_entries');
