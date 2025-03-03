const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const config = require('./config')[process.env.NODE_ENV || 'development'];

// Initialize Sequelize with the database URL
const sequelize = new Sequelize(config.url, {
  dialect: 'postgres',
  dialectOptions: config.dialectOptions,
  logging: msg => logger.debug(msg)
});

// Import models
const User = require('./models/user')(sequelize);
const Channel = require('./models/channel')(sequelize);
const Match = require('./models/match')(sequelize);

// Setup model associations
User.belongsToMany(Channel, { through: 'UserChannels' });
Channel.belongsToMany(User, { through: 'UserChannels' });

Match.belongsTo(User, { as: 'requester', foreignKey: 'userId' });
Match.belongsTo(User, { as: 'matched', foreignKey: 'matchedUserId' });

// Test database connection
const sync = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL database');
    
    // Sync all models
    await sequelize.sync();
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  sync,
  models: {
    User,
    Channel,
    Match
  }
};
