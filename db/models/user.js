const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    teamId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    realName: {
      type: DataTypes.STRING
    },
    displayName: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.STRING
    },
    company: {
      type: DataTypes.STRING
    },
    isOptedOut: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastMatched: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    profilePicture: {
      type: DataTypes.STRING
    }
  });

  // Add a class method to find or create user by Slack ID
  User.findOrCreateBySlackId = async function(slackId, teamId, data = {}) {
    const [user, created] = await User.findOrCreate({
      where: { slackId },
      defaults: { teamId, ...data }
    });
    
    return { user, created };
  };

  return User;
};
