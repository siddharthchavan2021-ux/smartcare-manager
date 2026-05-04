const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure all Mongoose models include the 'id' virtual in JSON to match Java behavior
    mongoose.set('toJSON', { virtuals: true });
    mongoose.set('toObject', { virtuals: true });

    // Use family: 4 to force IPv4 and fix querySrv ECONNREFUSED on Windows
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('[SmartCare] MongoDB connected');
  } catch (err) {
    console.error('[SmartCare] MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
