const User = require('../models/User');
const Appointment = require('../models/Appointment');
const notificationService = require('../services/notification.service');

// Default threshold if not defined in env
const MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.45');

const euclideanDistance = (a, b) => {
  let sum = 0.0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const enrollFace = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    if (user.role.toUpperCase() !== 'PATIENT') {
      return res.status(403).json({ error: 'Only patients can enroll a face' });
    }

    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ error: 'Descriptor must have 128 values' });
    }

    user.faceDescriptor = descriptor;
    user.faceEnrolled = true;
    await user.save();

    res.json({
      message: 'Face enrolled successfully',
      enrolled: true
    });
  } catch (error) {
    console.error('[SmartCare] Face Enroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFaceStatus = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    res.json({ enrolled: !!user.faceEnrolled });
  } catch (error) {
    console.error('[SmartCare] Get Face Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const kioskCheckin = async (req, res) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ error: 'Invalid descriptor format' });
    }

    const enrolledPatients = await User.find({
      role: 'PATIENT',
      faceEnrolled: true,
      faceDescriptor: { $exists: true, $size: 128 }
    });

    if (!enrolledPatients.length) {
      return res.status(404).json({ error: 'No enrolled patients found' });
    }

    let bestMatch = null;
    let bestDistance = Number.MAX_VALUE;

    for (const patient of enrolledPatients) {
      const distance = euclideanDistance(descriptor, patient.faceDescriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = patient;
      }
    }

    if (!bestMatch || bestDistance > MATCH_THRESHOLD) {
      return res.status(404).json({
        error: 'Face not recognized',
        distance: bestDistance
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find today's CONFIRMED or PENDING appointment for this patient
    const appt = await Appointment.findOne({
      patientId: bestMatch._id,
      date: todayStr,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    }).sort({ createdAt: -1 });

    if (!appt) {
      return res.status(404).json({
        error: 'No appointment found for today',
        patientName: bestMatch.name,
        recognized: true
      });
    }

    // Mark as CHECKED_IN
    appt.status = 'CHECKED_IN';
    appt.checkedInAt = new Date();
    await appt.save();

    await notificationService.notifyDoctorPatientCheckedIn(appt);

    res.json({
      success: true,
      patientName: bestMatch.name,
      doctorName: appt.doctorName,
      timeSlot: appt.timeSlot,
      reason: appt.reason || '',
      specialization: appt.specialization || '',
      distance: bestDistance
    });
  } catch (error) {
    console.error('[SmartCare] Kiosk Checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  enrollFace,
  getFaceStatus,
  kioskCheckin
};
