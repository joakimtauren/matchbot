const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connect = async () => {
  try {
    // Set mongoose connection options suitable for Replit
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      autoIndex: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connect,
  models: {
    User: require('./models/user'),
    Channel: require('./models/channel'),
    Match: require('./models/match')
  }
};
