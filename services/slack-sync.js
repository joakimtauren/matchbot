const { models } = require('../db');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Synchronizes users from Slack channels
 */
class SlackSyncService {
  /**
   * Performs initial sync of all channels and users
   * @param {Object} client - Slack client instance
   */
  async initialSync(client) {
    try {
      // Get all conversations the bot is part of
      const result = await client.conversations.list({
        types: 'public_channel,private_channel',
      });

      if (result.channels && result.channels.length > 0) {
        for (const channel of result.channels) {
          await this.syncChannel(client, channel.id);
        }
      }
    } catch (error) {
      logger.error('Error during initial sync:', error);
      throw error;
    }
  }

  /**
   * Syncs a specific channel and its members
   * @param {Object} client - Slack client instance
   * @param {String} channelId - The channel ID to sync
   */
  async syncChannel(client, channelId) {
    try {
      // Get channel info
      const channelInfo = await client.conversations.info({ channel: channelId });
      
      // Get or create channel in our database
      const { channel } = await models.Channel.findOrCreateByChannelId(
        channelId,
        channelInfo.channel.team_id || '',
        {
          name: channelInfo.channel.name,
          isPrivate: channelInfo.channel.is_private
        }
      );
      
      // Get members of the channel
      const memberIds = await this.getChannelMembers(client, channelId);
      
      // Set last synced time
      channel.lastSynced = new Date();
      channel.memberCount = memberIds.length;
      await channel.save();

      // Sync each member's profile
      for (const memberId of memberIds) {
        const user = await this.syncUserProfile(client, memberId, channelId);
        if (user) {
          // Add association to channel
          await channel.addUser(user);
        }
      }

      // Remove users who are no longer in the channel
      const channelUsers = await channel.getUsers();
      for (const user of channelUsers) {
        if (!memberIds.includes(user.slackId)) {
          await channel.removeUser(user);
        }
      }

      logger.info(`Synced channel ${channelInfo.channel.name} with ${memberIds.length} members`);
    } catch (error) {
      logger.error(`Error syncing channel ${channelId}:`, error);
    }
  }

  /**
   * Gets all members of a channel
   * @param {Object} client - Slack client instance
   * @param {String} channelId - The channel ID
   * @returns {Array} - Array of member IDs
   */
  async getChannelMembers(client, channelId) {
    const members = [];
    let cursor;

    try {
      do {
        const response = await client.conversations.members({
          channel: channelId,
          cursor,
        });

        members.push(...response.members);
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      return members;
    } catch (error) {
      logger.error(`Error getting channel members for ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Syncs a user's profile information
   * @param {Object} client - Slack client instance
   * @param {String} userId - The user ID to sync
   * @param {String} channelId - The channel context
   * @returns {Object} - The user model instance
   */
  async syncUserProfile(client, userId, channelId) {
    try {
      // Skip bot users
      const userInfo = await client.users.info({ user: userId });
      if (userInfo.user.is_bot) {
        return null;
      }

      // Get or create user in our database
      const { user } = await models.User.findOrCreateBySlackId(
        userId,
        userInfo.user.team_id || '',
        {
          realName: userInfo.user.real_name || '',
          displayName: userInfo.user.profile.display_name || '',
          email: userInfo.user.profile.email || '',
          profilePicture: userInfo.user.profile.image_192 || '',
          role: userInfo.user.profile.title || '',
          company: userInfo.user.profile.organization || userInfo.user.profile.company || ''
        }
      );

      // Update user information if it already exists
      if (user) {
        user.realName = userInfo.user.real_name || user.realName;
        user.displayName = userInfo.user.profile.display_name || user.displayName;
        user.email = userInfo.user.profile.email || user.email;
        user.profilePicture = userInfo.user.profile.image_192 || user.profilePicture;
        user.role = userInfo.user.profile.title || user.role;
        user.company = userInfo.user.profile.organization || 
                      userInfo.user.profile.company || 
                      user.company;
        
        await user.save();
      }

      return user;
    } catch (error) {
      logger.error(`Error syncing user profile for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Updates a user's channel membership when they join a channel
   */
  async handleUserJoinChannel(client, userId, channelId) {
    try {
      const user = await this.syncUserProfile(client, userId, channelId);
      if (!user) return;
      
      const { channel } = await models.Channel.findOrCreateByChannelId(channelId);
      if (channel) {
        await channel.addUser(user);
        channel.memberCount = await channel.countUsers();
        await channel.save();
      }
    } catch (error) {
      logger.error(`Error handling user join channel for ${userId} in ${channelId}:`, error);
    }
  }

  /**
   * Updates a user's channel membership when they leave a channel
   */
  async handleUserLeaveChannel(userId, channelId) {
    try {
      const user = await models.User.findOne({ where: { slackId: userId } });
      if (!user) return;
      
      const channel = await models.Channel.findOne({ where: { channelId } });
      if (channel) {
        await channel.removeUser(user);
        channel.memberCount = await channel.countUsers();
        await channel.save();
      }
    } catch (error) {
      logger.error(`Error handling user leave channel for ${userId} in ${channelId}:`, error);
    }
  }
}

module.exports = new SlackSyncService();
