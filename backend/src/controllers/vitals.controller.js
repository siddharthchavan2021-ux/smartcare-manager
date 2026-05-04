const Vitals = require('../models/Vitals');
const User = require('../models/User');

const syncVitals = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const { heartRate, spo2, steps, sleepMinutes, recordedAt } = req.body;

    const vitals = await Vitals.create({
      patientId: user._id,
      patientEmail: user.email,
      heartRate,
      spo2,
      steps,
      sleepMinutes,
      source: 'WATCH',
      recordedAt: recordedAt ? new Date(recordedAt) : new Date()
    });

    res.status(201).json(vitals);
  } catch (error) {
    console.error('[SmartCare] Sync Vitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLatestVitals = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const latest = await Vitals.findOne({ patientId: user._id }).sort({ recordedAt: -1 });

    if (!latest) {
      return res.json({
        heartRate: null,
        spo2: null,
        steps: null,
        sleepMinutes: null,
        source: null,
        recordedAt: null,
        message: 'No vitals data yet. Sync your smartwatch.'
      });
    }

    res.json(latest);
  } catch (error) {
    console.error('[SmartCare] Get Latest Vitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getVitalsHistory = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    const hours = parseInt(req.query.hours || '24', 10);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await Vitals.find({
      patientId: user._id,
      recordedAt: { $gte: since, $lte: new Date() }
    }).sort({ recordedAt: 1 });

    res.json(history);
  } catch (error) {
    console.error('[SmartCare] Get Vitals History error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  syncVitals,
  getLatestVitals,
  getVitalsHistory
};
