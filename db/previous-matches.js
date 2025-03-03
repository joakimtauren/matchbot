const { Op } = require('sequelize');
const { models } = require('./index');
const logger = require('../utils/logger');

/**
 * Utility to manage previous matches for users
 */
class PreviousMatches {
  /**
   * Get previous matches for a user
   * @param {String} slackUserId - The Slack user ID
   * @returns {Array} Array of Slack IDs of previously matched users
   */
  async getPreviousMatches(slackUserId) {
    try {
      // Find the user
      const user = await models.User.findOne({
        where: { slackId: slackUserId }
      });
      
      if (!user) {
        return [];
      }
      
      // Get all matches where this user was involved
      const matches = await models.Match.findAll({
        where: {
          [Op.or]: [
            { userId: user.id },
            { matchedUserId: user.id }
          ]
        },
        include: [
          { model: models.User, as: 'requester' },
          { model: models.User, as: 'matched' }
        ]
      });
      
      // Extract and return unique Slack IDs of matched users
      const previousMatchSlackIds = matches.map(match => {
        if (match.userId === user.id) {
          return match.slackMatchedUserId;
        } else {
          return match.slackUserId;
        }
      });
      
      return [...new Set(previousMatchSlackIds)];
    } catch (error) {
      logger.error(`Error getting previous matches for ${slackUserId}:`, error);
      return [];
    }
  }
  
  /**
   * Record a new match
   * @param {Object} user - The requester user object
   * @param {Object} matchedUser - The matched user object
   * @param {String} channelId - The channel ID
   * @param {String} teamId - The team ID
   * @param {Number} similarityScore - The match similarity score
   */
  async recordMatch(user, matchedUser, channelId, teamId, similarityScore) {
    try {
      await models.Match.create({
        userId: user.id,
        matchedUserId: matchedUser.id,
        channelId,
        teamId,
        slackUserId: user.slackId,
        slackMatchedUserId: matchedUser.slackId,
        similarityScore
      });
      
      // Update lastMatched timestamp
      await models.User.update(
        { lastMatched: new Date() },
        { where: { id: user.id } }
      );
    } catch (error) {
      logger.error(`Error recording match between ${user.slackId} and ${matchedUser.slackId}:`, error);
    }
  }
  
  /**
   * Update a match with interaction info
   * @param {String} slackUserId - The Slack ID of the requester
   * @param {String} slackMatchedUserId - The Slack ID of the matched user
   * @param {String} channelId - The channel ID
   * @param {String} interactionType - The type of interaction
   */
  async updateMatchInteraction(slackUserId, slackMatchedUserId, channelId, interactionType) {
    try {
      await models.Match.update(
        { 
          interactionType,
          status: 'accepted'
        },
        {
          where: {
            slackUserId,
            slackMatchedUserId,
            channelId
          }
        }
      );
    } catch (error) {
      logger.error(`Error updating match interaction between ${slackUserId} and ${slackMatchedUserId}:`, error);
    }
  }
}

module.exports = new PreviousMatches();
