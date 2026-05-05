const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointments.routes');
const vitalsRoutes = require('./routes/vitals.routes');
const notificationRoutes = require('./routes/notifications.routes');
const doctorRoutes = require('./routes/doctors.routes');
const faceRoutes = require('./routes/face.routes');
const adminRoutes = require('./routes/admin.routes');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for face descriptors if needed

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../../frontend/Frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/admin', adminRoutes);

// Add auth middleware to admin stats explicitly since /api/admin doesn't have it globally in routes yet
// Wait, we'll handle auth inside the route files themselves.

module.exports = app;
