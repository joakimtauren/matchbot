const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    teamId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastSynced: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  });

  // Add a class method to find or create channel by Slack channel ID
  Channel.findOrCreateByChannelId = async function(channelId, teamId, data = {}) {
    const [channel, created] = await Channel.findOrCreate({
      where: { channelId },
      defaults: { teamId, ...data }
    });
    
    return { channel, created };
  };

  return Channel;
};
