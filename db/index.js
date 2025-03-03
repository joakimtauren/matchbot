const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
