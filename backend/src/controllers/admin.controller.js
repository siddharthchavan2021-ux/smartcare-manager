const User = require('../models/User');
const Appointment = require('../models/Appointment');

const getStats = async (req, res) => {
  try {
    const admin = await User.findOne({ email: req.user.email });
    if (!admin || admin.role.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allUsers = await User.find();
    const totalUsers = allUsers.length;
    const totalPatients = allUsers.filter(u => u.role.toUpperCase() === 'PATIENT').length;
    const totalDoctors = allUsers.filter(u => u.role.toUpperCase() === 'DOCTOR').length;
    const totalAdmins = allUsers.filter(u => u.role.toUpperCase() === 'ADMIN').length;
    const activeUsers = allUsers.filter(u => u.enabled).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const allAppts = await Appointment.find();
    const todayAppts = allAppts.filter(a => a.date === todayStr).length;
    const pendingAppts = allAppts.filter(a => a.status === 'PENDING').length;
    const totalAppts = allAppts.length;

    res.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAdmins,
      activeUsers,
      todayAppts,
      pendingAppts,
      totalAppts
    });
  } catch (error) {
    console.error('[SmartCare] Get Admin Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const admin = await User.findOne({ email: req.user.email });
    if (!admin || admin.role.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit || '30', 10);
    const users = await User.find().sort({ createdAt: -1 }).limit(limit);

    const safeUsers = users.map(u => {
      const safe = {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        enabled: u.enabled,
        joinedAt: u.createdAt ? u.createdAt.toISOString().split('T')[0] : null
      };
      if (u.role.toUpperCase() === 'DOCTOR') {
        safe.specialization = u.specialization;
      }
      return safe;
    });

    res.json(safeUsers);
  } catch (error) {
    console.error('[SmartCare] Get Admin Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const toggleUser = async (req, res) => {
  try {
    const admin = await User.findOne({ email: req.user.email });
    if (!admin || admin.role.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role.toUpperCase() === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot disable an admin account' });
    }

    user.enabled = !user.enabled;
    await user.save();

    res.json({
      message: user.enabled ? 'Account enabled' : 'Account disabled',
      enabled: user.enabled
    });
  } catch (error) {
    console.error('[SmartCare] Toggle User error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  toggleUser
};
