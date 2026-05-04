const Notification = require('../models/Notification');
const User = require('../models/User');

const getNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('[SmartCare] Get Notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const count = await Notification.countDocuments({ userId: user._id, read: false });
    res.json({ unread: count });
  } catch (error) {
    console.error('[SmartCare] Get Unread Count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    if (String(notif.userId) !== String(user._id)) {
      return res.status(403).json({ error: 'Not your notification' });
    }

    notif.read = true;
    await notif.save();

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('[SmartCare] Mark Read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const result = await Notification.updateMany(
      { userId: user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All marked as read', count: result.modifiedCount });
  } catch (error) {
    console.error('[SmartCare] Mark All Read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead
};
