'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      slackId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      realName: {
        type: Sequelize.STRING
      },
      displayName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING
      },
      company: {
        type: Sequelize.STRING
      },
      isOptedOut: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastMatched: {
        type: Sequelize.DATE,
        defaultValue: null
      },
      profilePicture: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Channels table
    await queryInterface.createTable('Channels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      memberCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastSynced: {
        type: Sequelize.DATE,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create junction table for Users-Channels many-to-many
    await queryInterface.createTable('UserChannels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ChannelId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Channels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Matches table
    await queryInterface.createTable('Matches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      matchedUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slackUserId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slackMatchedUserId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('suggested', 'accepted', 'rejected', 'expired'),
        defaultValue: 'suggested'
      },
      interactionType: {
        type: Sequelize.ENUM('direct_message', 'calendar', 'none'),
        defaultValue: 'none'
      },
      similarityScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique constraint to prevent duplicate matches
    await queryInterface.addIndex('Matches', ['userId', 'matchedUserId', 'channelId'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('Matches');
    await queryInterface.dropTable('UserChannels');
    await queryInterface.dropTable('Channels');
    await queryInterface.dropTable('Users');
  }
};
