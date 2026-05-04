const mongoose = require('mongoose');

/**
 * User model — single collection for PATIENT, DOCTOR, ADMIN.
 * Mirrors the Java User.java model exactly.
 */
const userSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true },
    email:   { type: String, required: true, unique: true },
    password:{ type: String, required: true },
    role:    { type: String, default: 'PATIENT', enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
    enabled: { type: Boolean, default: false },

    // Shared optional fields
    phone: String,
    dob:   String,

    // Patient-specific
    gender:           String,
    bloodGroup:       String,
    address:          String,
    city:             String,
    zipcode:          String,
    emergencyContact: String,

    // Doctor-specific
    licenseNumber:  String,
    specialization: String,
    experience:     Number,
    qualification:  String,
    hospital:       String,
    clinicAddress:  String,
    consultFee:     Number,

    // Admin-specific
    employeeId:  String,
    department:  String,
    accessLevel: String,
    jobTitle:    String,

    // Face recognition (128-element float array from face-api.js)
    faceDescriptor: [Number],
    faceEnrolled:   { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('User', userSchema, 'users');
