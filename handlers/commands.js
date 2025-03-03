const { models } = require('../db');
const matcherService = require('../services/matcher');
const blockBuilder = require('../ui/blocks');
const logger = require('../utils/logger');

/**
 * Handler for the /match command
 */
async function matchCommand({ command, ack, client, respond }) {
  try {
    // Acknowledge the command request
    await ack();

    const userId = command.user_id;
    const channelId = command.channel_id;
    const teamId = command.team_id;

    // Check if the user has opted out
    const user = await models.User.findOne({ where: { slackId: userId } });
    if (user && user.isOptedOut) {
      return await respond({
        text: "You've opted out of matching. Use `/opt-in` to start receiving matches again.",
        response_type: 'ephemeral'
      });
    }

    // Find potential matches for this user in this channel
    const matches = await matcherService.findMatches(userId, channelId);
    
    if (!matches || matches.length === 0) {
      return await respond({
        text: "Sorry, I couldn't find any suitable matches for you in this channel right now.",
        response_type: 'ephemeral'
      });
    }

    // Record matches in the database
    for (const match of matches) {
      await matcherService.recordMatch(
        userId, 
        match.user.slackId, 
        channelId, 
        teamId,
        match.score
      );
    }

    // Build and send the matches UI
    const matchesBlocks = blockBuilder.buildMatchesMessage(matches);
    
    await respond({
      blocks: matchesBlocks,
      text: "Here are your matches!",
      response_type: 'ephemeral'
    });
    
  } catch (error) {
    logger.error('Error handling match command:', error);
    await respond({
      text: "Sorry, something went wrong while trying to find matches. Please try again later.",
      response_type: 'ephemeral'
    });
  }
}

/**
 * Handler for the /opt-out command
 */
async function optOutCommand({ command, ack, respond }) {
  try {
    await ack();
    
    const userId = command.user_id;
    
    const [updated] = await models.User.update(
      { isOptedOut: true },
      { where: { slackId: userId } }
    );
    
    if (updated === 0) {
      // User doesn't exist yet, create them
      await models.User.create({
        slackId: userId,
        teamId: command.team_id,
        isOptedOut: true
      });
    }
    
    await respond({
      text: "You've successfully opted out of matching. Use `/opt-in` if you want to opt back in later.",
      response_type: 'ephemeral'
    });
    
  } catch (error) {
    logger.error('Error handling opt-out command:', error);
    await respond({
      text: "Sorry, something went wrong while opting out. Please try again later.",
      response_type: 'ephemeral'
    });
  }
}

/**
 * Handler for the /opt-in command
 */
async function optInCommand({ command, ack, respond }) {
  try {
    await ack();
    
    const userId = command.user_id;
    
    const [updated] = await models.User.update(
      { isOptedOut: false },
      { where: { slackId: userId } }
    );
    
    if (updated === 0) {
      // User doesn't exist yet, create them
      await models.User.create({
        slackId: userId,
        teamId: command.team_id,
        isOptedOut: false
      });
    }
    
    await respond({
      text: "You've successfully opted in to matching. Use `/match` to find new connections!",
      response_type: 'ephemeral'
    });
    
  } catch (error) {
    logger.error('Error handling opt-in command:', error);
    await respond({
      text: "Sorry, something went wrong while opting in. Please try again later.",
      response_type: 'ephemeral'
    });
  }
}

/**
 * Handler for the "Send DM" button
 */
async function sendDirectMessage({ action, body, ack, client }) {
  try {
    await ack();
    
    const userId = body.user.id;
    const matchedUserId = action.value;
    const channelId = body.channel.id;
    
    // Open a DM with the matched user
    const conversation = await client.conversations.open({
      users: matchedUserId
    });
    
    if (conversation.ok && conversation.channel) {
      // Update match interaction type
      await matcherService.updateMatchInteraction(
        userId,
        matchedUserId,
        channelId,
        'direct_message'
      );
      
      // Get user info for personalized message
      const userInfo = await client.users.info({ user: userId });
      const matchedUserInfo = await client.users.info({ user: matchedUserId });
      
      // Send a message to the DM
      await client.chat.postMessage({
        channel: conversation.channel.id,
        text: `Hello ${matchedUserInfo.user.real_name || 'there'}! I'm ${userInfo.user.real_name || 'a fellow member'} from the Slack channel. We were matched by the Matcher bot and I'd love to connect!`
      });
      
      // Update the original message
      await client.chat.update({
        channel: body.channel.id,
        ts: body.message.ts,
        blocks: blockBuilder.buildMatchInteractionConfirmation(
          matchedUserInfo.user,
          'direct_message'
        ),
        text: "Match interaction confirmation"
      });
    }
  } catch (error) {
    logger.error('Error handling send direct message action:', error);
  }
}

/**
 * Handler for the "Open Calendar" button
 */
async function openCalendar({ action, body, ack, client, respond }) {
  try {
    await ack();
    
    const userId = body.user.id;
    const matchedUserId = action.value;
    const channelId = body.channel.id;
    
    // Get the matched user's email
    const matchedUser = await models.User.findOne({ 
      where: { slackId: matchedUserId }
    });
    
    if (matchedUser && matchedUser.email) {
      // Update match interaction type
      await matcherService.updateMatchInteraction(
        userId,
        matchedUserId,
        channelId,
        'calendar'
      );
      
      // Get matched user info for the confirmation message
      const matchedUserInfo = await client.users.info({ user: matchedUserId });
      
      // Update the original message
      await client.chat.update({
        channel: body.channel.id,
        ts: body.message.ts,
        blocks: blockBuilder.buildMatchInteractionConfirmation(
          matchedUserInfo.user,
          'calendar'
        ),
        text: "Match interaction confirmation"
      });
      
      // Respond with the calendar URL that includes the email
      await respond({
        text: `Opening your calendar with ${matchedUser.email}. If your browser doesn't open automatically, use this link: https://calendar.google.com/calendar/u/0/r/eventedit?add=${encodeURIComponent(matchedUser.email)}`,
        response_type: 'ephemeral'
      });
    } else {
      await respond({
        text: "Sorry, I couldn't find an email address for this user.",
        response_type: 'ephemeral'
      });
    }
  } catch (error) {
    logger.error('Error handling open calendar action:', error);
  }
}

module.exports = {
  matchCommand,
  optOutCommand,
  optInCommand,
  sendDirectMessage,
  openCalendar
};
