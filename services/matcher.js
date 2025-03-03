const { models } = require('../db');
const logger = require('../utils/logger');

class MatcherService {
  /**
   * Find potential matches for a user in a specific channel
   * @param {String} userId - The user requesting matches
   * @param {String} channelId - The channel context
   * @returns {Array} - Array of potential matches with scores
   */
  async findMatches(userId, channelId) {
    try {
      // Get the user
      const user = await models.User.findOne({ slackId: userId });
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      if (user.isOptedOut) {
        throw new Error(`User ${userId} has opted out of matching`);
      }

      // Get all users in the same channel who haven't opted out
      const channel = await models.Channel.findOne({ channelId });
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // Get eligible users in this channel
      const eligibleUsers = await models.User.find({
        slackId: { $ne: userId },
        channels: channelId,
        isOptedOut: false
      });

      if (eligibleUsers.length === 0) {
        return [];
      }

      // Get previous matches to avoid duplication
      const previousMatches = user.previousMatches.map(match => match.userId);

      // Score and rank potential matches
      const scoredMatches = await this.scoreMatches(user, eligibleUsers, previousMatches);
      
      // Sort by score (descending) and take top 3
      return scoredMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    } catch (error) {
      logger.error(`Error finding matches for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Score potential matches based on similarity and business rules
   * @param {Object} user - The user requesting matches
   * @param {Array} potentialMatches - Eligible users to match with
   * @param {Array} previousMatches - IDs of previously matched users
   * @returns {Array} - Scored potential matches
   */
  async scoreMatches(user, potentialMatches, previousMatches) {
    const scoredMatches = [];

    for (const potentialMatch of potentialMatches) {
      // Skip previously matched users when possible
      const isRecentMatch = previousMatches.includes(potentialMatch.slackId);
      
      // Base score
      let score = 100;
      
      // Decrease score for previous matches
      if (isRecentMatch) {
        score -= 50;
      }
      
      // Prioritize cross-company matches
      if (user.company && potentialMatch.company && 
          user.company !== potentialMatch.company && 
          user.company.trim() !== '' && potentialMatch.company.trim() !== '') {
        score += 30;
      }
      
      // Prioritize similar roles
      if (user.role && potentialMatch.role) {
        const roleSimilarity = this.calculateRoleSimilarity(user.role, potentialMatch.role);
        score += roleSimilarity * 20; // Add up to 20 points for similar roles
      }
      
      // Add some randomness to avoid always matching the same people
      score += Math.random() * 10;
      
      scoredMatches.push({
        user: potentialMatch,
        score,
        isRecentMatch
      });
    }

    return scoredMatches;
  }

  /**
   * Calculate similarity between roles (simple implementation)
   * @param {String} role1 - First role
   * @param {String} role2 - Second role
   * @returns {Number} - Similarity score (0-1)
   */
  calculateRoleSimilarity(role1, role2) {
    if (!role1 || !role2) return 0;
    
    // Convert roles to lowercase
    const r1 = role1.toLowerCase();
    const r2 = role2.toLowerCase();
    
    // Check for common role keywords
    const keywords = [
      'engineer', 'developer', 'manager', 'director', 
      'product', 'design', 'sales', 'marketing',
      'operations', 'hr', 'finance', 'legal', 'support'
    ];
    
    let common = 0;
    for (const keyword of keywords) {
      if (r1.includes(keyword) && r2.includes(keyword)) {
        common++;
      }
    }
    
    // If no common keywords, use basic text similarity
    if (common === 0) {
      const maxLength = Math.max(r1.length, r2.length);
      if (maxLength === 0) return 0;
      
      let sameChars = 0;
      const minLength = Math.min(r1.length, r2.length);
      
      for (let i = 0; i < minLength; i++) {
        if (r1[i] === r2[i]) {
          sameChars++;
        }
      }
      
      return sameChars / maxLength;
    }
    
    return Math.min(common / 2, 1); // Cap at 1.0
  }

  /**
   * Record a match in the database
   * @param {String} userId - The user requesting matches
   * @param {String} matchedUserId - The matched user
   * @param {String} channelId - The channel context
   * @param {Number} similarityScore - The calculated similarity score
   */
  async recordMatch(userId, matchedUserId, channelId, teamId, similarityScore) {
    try {
      // Create new match record
      const match = new models.Match({
        userId,
        matchedUserId,
        channelId,
        teamId,
        status: 'suggested',
        similarityScore
      });
      
      await match.save();

      // Update both users' previous matches array
      await models.User.findOneAndUpdate(
        { slackId: userId },
        { 
          $push: { previousMatches: { userId: matchedUserId, timestamp: new Date() } },
          $set: { lastMatched: new Date() }
        }
      );

      await models.User.findOneAndUpdate(
        { slackId: matchedUserId },
        { $push: { previousMatches: { userId, timestamp: new Date() } } }
      );

    } catch (error) {
      logger.error(`Error recording match between ${userId} and ${matchedUserId}:`, error);
    }
  }

  /**
   * Update a match record when a user interacts with it
   * @param {String} userId - The user who initiated the match
   * @param {String} matchedUserId - The matched user
   * @param {String} interactionType - The type of interaction
   */
  async updateMatchInteraction(userId, matchedUserId, channelId, interactionType) {
    try {
      await models.Match.findOneAndUpdate(
        { userId, matchedUserId, channelId },
        { 
          interactionType,
          status: 'accepted',
          updatedAt: new Date()
        }
      );
    } catch (error) {
      logger.error(`Error updating match interaction between ${userId} and ${matchedUserId}:`, error);
    }
  }
}

module.exports = new MatcherService();
