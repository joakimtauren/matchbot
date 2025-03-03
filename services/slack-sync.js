const { models } = require('../db');
const logger = require('../utils/logger');

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
      let channel = await models.Channel.findOne({ channelId });
      
      if (!channel) {
        channel = new models.Channel({
          channelId,
          teamId: channelInfo.channel.team_id || '',
          name: channelInfo.channel.name,
          isPrivate: channelInfo.channel.is_private,
        });
      } else {
        channel.name = channelInfo.channel.name;
        channel.isPrivate = channelInfo.channel.is_private;
      }

      // Get members of the channel
      const members = await this.getChannelMembers(client, channelId);
      channel.members = members;
      channel.memberCount = members.length;
      channel.lastSynced = new Date();
      await channel.save();

      // Sync each member's profile
      for (const memberId of members) {
        await this.syncUserProfile(client, memberId, channelId);
      }

      logger.info(`Synced channel ${channelInfo.channel.name} with ${members.length} members`);
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
   */
  async syncUserProfile(client, userId, channelId) {
    try {
      // Skip bot users
      const userInfo = await client.users.info({ user: userId });
      if (userInfo.user.is_bot) {
        return;
      }

      // Get or create user in our database
      let user = await models.User.findOne({ slackId: userId });
      
      if (!user) {
        user = new models.User({
          slackId: userId,
          teamId: userInfo.user.team_id || '',
          channels: [channelId],
        });
      } else if (!user.channels.includes(channelId)) {
        user.channels.push(channelId);
      }

      // Update user profile information
      user.realName = userInfo.user.real_name || '';
      user.displayName = userInfo.user.profile.display_name || '';
      user.email = userInfo.user.profile.email || '';
      user.profilePicture = userInfo.user.profile.image_192 || '';
      
      // Extract role and company from Slack profile
      user.role = userInfo.user.profile.title || '';
      user.company = userInfo.user.profile.organization || 
                    userInfo.user.profile.company || '';

      await user.save();
    } catch (error) {
      logger.error(`Error syncing user profile for ${userId}:`, error);
    }
  }

  /**
   * Updates a user's channel membership when they join a channel
   */
  async handleUserJoinChannel(client, userId, channelId) {
    try {
      await this.syncUserProfile(client, userId, channelId);
      
      // Update channel members list
      const channel = await models.Channel.findOne({ channelId });
      if (channel && !channel.members.includes(userId)) {
        channel.members.push(userId);
        channel.memberCount = channel.members.length;
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
      // Update user's channels list
      const user = await models.User.findOne({ slackId: userId });
      if (user) {
        user.channels = user.channels.filter(id => id !== channelId);
        await user.save();
      }
      
      // Update channel members list
      const channel = await models.Channel.findOne({ channelId });
      if (channel) {
        channel.members = channel.members.filter(id => id !== userId);
        channel.memberCount = channel.members.length;
        await channel.save();
      }
    } catch (error) {
      logger.error(`Error handling user leave channel for ${userId} in ${channelId}:`, error);
    }
  }
}

module.exports = new SlackSyncService();
