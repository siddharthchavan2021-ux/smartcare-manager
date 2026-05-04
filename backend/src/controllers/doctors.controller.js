const User = require('../models/User');

const getAllDoctors = async (req, res) => {
  try {
    // Auth is verified in middleware, but we'll fetch user to ensure they exist
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const { specialization } = req.query;

    const query = { role: 'DOCTOR', enabled: true };
    if (specialization) {
      // Case-insensitive regex match
      query.specialization = new RegExp('^' + specialization + '$', 'i');
    }

    const doctorsList = await User.find(query);

    const doctors = doctorsList.map(d => ({
      id: d._id,
      name: d.name,
      specialization: d.specialization,
      qualification: d.qualification,
      hospital: d.hospital,
      experience: d.experience,
      consultFee: d.consultFee,
      city: d.city
    }));

    res.json(doctors);
  } catch (error) {
    console.error('[SmartCare] Get All Doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllDoctors
};
