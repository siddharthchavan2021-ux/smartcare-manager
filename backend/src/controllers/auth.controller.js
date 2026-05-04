const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const otpService = require('../services/otp.service');

const VALID_ADMIN_CODES = ['ADMIN-2026', 'SMARTCARE-ADMIN'];

const register = async (req, res) => {
  try {
    let {
      name, email, password, role: reqRole, phone, dob,
      gender, bloodGroup, address, city, zipcode, emergencyContact,
      licenseNumber, specialization, experience, qualification, hospital, clinicAddress, consultFee,
      employeeId, department, accessLevel, jobTitle, authCode
    } = req.body;
    if (email) email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const role = (reqRole && reqRole.trim()) ? reqRole.toUpperCase() : 'PATIENT';

    if (role === 'ADMIN') {
      if (!authCode || !VALID_ADMIN_CODES.includes(authCode)) {
        return res.status(403).json({ error: 'Invalid authorization code for admin registration' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userObj = {
      name, email, password: hashedPassword, role, enabled: false, phone, dob
    };

    if (role === 'PATIENT') {
      Object.assign(userObj, { gender, bloodGroup, address, city, zipcode, emergencyContact });
    } else if (role === 'DOCTOR') {
      Object.assign(userObj, { licenseNumber, specialization, experience, qualification, hospital, clinicAddress, city, consultFee });
    } else if (role === 'ADMIN') {
      Object.assign(userObj, { employeeId, department, accessLevel, jobTitle });
    }

    await User.create(userObj);
    await otpService.generateAndSendOtp(email, name);

    res.status(201).json({
      message: 'Account created. Please check your email for the OTP.',
      email
    });
  } catch (error) {
    console.error('[SmartCare] Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.toLowerCase().trim();
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email' });
    }

    if (user.enabled) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    const isValid = await otpService.verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    user.enabled = true;
    await user.save();

    const token = jwt.sign({ sub: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Email verified successfully!',
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('[SmartCare] Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email' });
    }

    if (user.enabled) {
      return res.status(400).json({ error: 'Account already verified.' });
    }

    await otpService.generateAndSendOtp(email, user.name);
    res.json({ message: `A new OTP has been sent to ${email}` });
  } catch (error) {
    console.error('[SmartCare] Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    console.log('[DEBUG LOGIN] Incoming request:', req.body);
    let { email, password } = req.body;
    if (email) email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.enabled) {
      return res.status(403).json({
        error: 'Email not verified. Please check your inbox for the OTP.',
        unverified: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ sub: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      id: user._id,
      name: user.name || 'User',
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('[SmartCare] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (user && user.enabled) {
      await otpService.generateAndSendOtp(email, user.name);
    }

    res.json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch (error) {
    console.error('[SmartCare] Forgot Password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'email, otp and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const isValid = await otpService.verifyOtp(email, otp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired reset code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('[SmartCare] Reset Password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register, verifyOtp, resendOtp, login, forgotPassword, resetPassword
};
