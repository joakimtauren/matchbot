const slackSyncService = require('../services/slack-sync');
const logger = require('../utils/logger');

/**
 * Handles when a new member joins the team
 */
async function teamJoin({ event, client }) {
  try {
    // Sync the new user's profile
    await slackSyncService.syncUserProfile(client, event.user.id);
    logger.info(`New user joined team: ${event.user.id}`);
  } catch (error) {
    logger.error(`Error handling team_join event for user ${event.user.id}:`, error);
  }
}

/**
 * Handles when a user's profile is changed
 */
async function profileChanged({ event, client }) {
  try {
    // Sync the updated user profile
    await slackSyncService.syncUserProfile(client, event.user.id);
    logger.info(`User profile updated: ${event.user.id}`);
  } catch (error) {
    logger.error(`Error handling profile_changed event for user ${event.user.id}:`, error);
  }
}

/**
 * Handles when a member joins a channel
 */
async function memberJoinedChannel({ event, client }) {
  try {
    await slackSyncService.handleUserJoinChannel(client, event.user, event.channel);
    logger.info(`User ${event.user} joined channel ${event.channel}`);
  } catch (error) {
    logger.error(`Error handling member_joined_channel event for user ${event.user} in channel ${event.channel}:`, error);
  }
}

/**
 * Handles when a member leaves a channel
 */
async function memberLeftChannel({ event }) {
  try {
    await slackSyncService.handleUserLeaveChannel(event.user, event.channel);
    logger.info(`User ${event.user} left channel ${event.channel}`);
  } catch (error) {
    logger.error(`Error handling member_left_channel event for user ${event.user} in channel ${event.channel}:`, error);
  }
}

module.exports = {
  teamJoin,
  profileChanged,
  memberJoinedChannel,
  memberLeftChannel
};
