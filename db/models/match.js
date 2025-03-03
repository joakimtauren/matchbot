const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    matchedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    teamId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slackUserId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slackMatchedUserId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('suggested', 'accepted', 'rejected', 'expired'),
      defaultValue: 'suggested'
    },
    interactionType: {
      type: DataTypes.ENUM('direct_message', 'calendar', 'none'),
      defaultValue: 'none'
    },
    similarityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    indexes: [
      // Create a unique index on userId, matchedUserId, and channelId
      {
        unique: true,
        fields: ['userId', 'matchedUserId', 'channelId']
      }
    ]
  });

  return Match;
};
