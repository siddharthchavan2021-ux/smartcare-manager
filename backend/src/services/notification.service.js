const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const emailService = require('./email.service');
const cron = require('node-cron');

/**
 * Notification Service — mirrors Java NotificationService.java exactly.
 */

const formatDate = (isoDate) => {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (err) {
    return isoDate;
  }
};

const notifyDoctorAppointmentBooked = async (appt) => {
  await Notification.create({
    userId: appt.doctorId,
    type: 'APPOINTMENT_BOOKED',
    title: 'New Appointment Request',
    message: `${appt.patientName} has requested an appointment on ${formatDate(appt.date)} at ${appt.timeSlot}. Reason: ${appt.reason}`,
    appointmentId: appt._id,
    relatedUserName: appt.patientName,
  });

  const doctor = await User.findById(appt.doctorId);
  if (doctor) {
    await emailService.sendAppointmentEmail(
      doctor.email,
      doctor.name,
      'New Appointment Request',
      `${appt.patientName} has requested an appointment.`,
      formatDate(appt.date),
      appt.timeSlot,
      appt.reason,
      'Please log in to confirm or reject this appointment.',
      '#3b9eff'
    );
  }
};

const notifyPatientStatusChanged = async (appt) => {
  const status = appt.status;
  let type, title, message, colorHex, hint;

  if (status === 'CONFIRMED') {
    type = 'APPOINTMENT_CONFIRMED';
    title = 'Appointment Confirmed ✓';
    message = `Your appointment with ${appt.doctorName} on ${formatDate(appt.date)} at ${appt.timeSlot} has been confirmed.`;
    colorHex = '#22d3a5';
    hint = 'Please arrive 10 minutes early.';
  } else if (status === 'CANCELLED') {
    type = 'APPOINTMENT_CANCELLED';
    title = 'Appointment Rejected';
    message = `Your appointment request with ${appt.doctorName} on ${formatDate(appt.date)} at ${appt.timeSlot} was not confirmed.` +
      (appt.doctorNote ? ` Note: ${appt.doctorNote}` : '');
    colorHex = '#f25272';
    hint = 'You can book a different time slot.';
  } else {
    return;
  }

  await Notification.create({
    userId: appt.patientId,
    type,
    title,
    message,
    appointmentId: appt._id,
    relatedUserName: appt.doctorName,
  });

  await emailService.sendAppointmentEmail(
    appt.patientEmail,
    appt.patientName,
    title,
    message,
    formatDate(appt.date),
    appt.timeSlot,
    appt.reason,
    hint,
    colorHex
  );
};

const notifyDoctorPatientCheckedIn = async (appt) => {
  await Notification.create({
    userId: appt.doctorId,
    type: 'PATIENT_CHECKED_IN',
    title: 'Patient Checked In ✓',
    message: `${appt.patientName} has checked in for their ${appt.timeSlot} appointment. They are in the waiting area.`,
    appointmentId: appt._id,
    relatedUserName: appt.patientName,
  });

  const doctor = await User.findById(appt.doctorId);
  if (doctor) {
    await emailService.sendAppointmentEmail(
      doctor.email,
      doctor.name,
      'Patient Checked In',
      `${appt.patientName} has checked in via the kiosk.`,
      formatDate(appt.date),
      appt.timeSlot,
      appt.reason || '—',
      'Your patient is in the waiting area and ready to be seen.',
      '#22d3a5'
    );
  }
};

// Daily reminder job at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log(`[SmartCare] Running daily reminder job for: ${tomorrowStr}`);

  try {
    const tomorrowAppts = await Appointment.find({
      date: tomorrowStr,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    });

    for (const appt of tomorrowAppts) {
      const existing = await Notification.findOne({
        appointmentId: appt._id,
        type: 'APPOINTMENT_REMINDER'
      });

      if (existing) continue;

      await Notification.create({
        userId: appt.patientId,
        type: 'APPOINTMENT_REMINDER',
        title: 'Appointment Tomorrow 🔔',
        message: `Reminder: You have an appointment with ${appt.doctorName} tomorrow (${formatDate(appt.date)}) at ${appt.timeSlot}.`,
        appointmentId: appt._id,
        relatedUserName: appt.doctorName,
      });

      await emailService.sendAppointmentEmail(
        appt.patientEmail,
        appt.patientName,
        'Appointment Reminder — Tomorrow',
        'You have an appointment scheduled for tomorrow.',
        formatDate(appt.date),
        appt.timeSlot,
        appt.reason,
        'Please arrive 10 minutes early. Contact us if you need to reschedule.',
        '#f5a623'
      );
      console.log(`[SmartCare] Reminder sent to: ${appt.patientEmail}`);
    }
    console.log(`[SmartCare] Reminder job done. Processed ${tomorrowAppts.length} appointments.`);
  } catch (err) {
    console.error('[SmartCare] Error in reminder job:', err);
  }
});

module.exports = {
  notifyDoctorAppointmentBooked,
  notifyPatientStatusChanged,
  notifyDoctorPatientCheckedIn
};
