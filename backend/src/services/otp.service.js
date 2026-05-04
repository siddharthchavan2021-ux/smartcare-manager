const crypto = require('crypto');
const OtpEntry = require('../models/OtpEntry');
const emailService = require('./email.service');

/**
 * OTP Service — mirrors Java OtpService.java exactly.
 * Generates, stores, verifies, and deletes OTPs.
 */

/**
 * Generates a 6-digit OTP, saves to MongoDB (TTL 5 min), and emails it.
 */
const generateAndSendOtp = async (email, name) => {
  // Delete any existing OTP for this email (handles resend)
  await OtpEntry.deleteMany({ email });

  // Generate cryptographically random 6-digit OTP (padded)
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

  // Save to MongoDB (auto-expires after 5 min via TTL index)
  await OtpEntry.create({ email, code });

  // Send the email
  await emailService.sendOtpEmail(email, code, name);
};

/**
 * Verifies the OTP submitted by the user.
 * Returns true if valid and not expired, false otherwise.
 * Deletes the OTP on successful verify (single-use).
 */
const verifyOtp = async (email, code) => {
  const entry = await OtpEntry.findOne({ email }).sort({ createdAt: -1 });
  if (!entry) return false;

  const valid = entry.code === code;
  if (valid) {
    await OtpEntry.deleteMany({ email });
  }
  return valid;
};

/**
 * Checks if an OTP is currently pending for this email.
 */
const hasActiveOtp = async (email) => {
  return !!(await OtpEntry.findOne({ email }));
};

module.exports = { generateAndSendOtp, verifyOtp, hasActiveOtp };
