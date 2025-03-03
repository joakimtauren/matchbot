/**
 * Builds a message with matches to present to the user
 * @param {Array} matches - The matches to present
 * @returns {Array} - Slack blocks for the message
 */
function buildMatchesMessage(matches) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎯 Here are your matches!",
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "I've found some people you might want to connect with. Check them out and choose how you'd like to reach out:"
      }
    },
    {
      type: "divider"
    }
  ];

  // Add each match with its action buttons
  matches.forEach(match => {
    const user = match.user;
    
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${user.realName || user.displayName || 'Unknown User'}*\n${user.role || 'No role'} at ${user.company || 'Unknown Company'}`
        },
        accessory: {
          type: "image",
          image_url: user.profilePicture || "https://api.slack.com/img/blocks/bkb_template_images/profile_1.png",
          alt_text: user.realName || user.displayName || "User profile picture"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Send Direct Message",
              emoji: true
            },
            style: "primary",
            value: user.slackId,
            action_id: "send_dm"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Schedule Meeting",
              emoji: true
            },
            value: user.slackId,
            action_id: "open_calendar"
          }
        ]
      },
      {
        type: "divider"
      }
    );
  });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Don't want to receive matches? Use `/opt-out` to stop receiving match suggestions."
      }
    ]
  });

  return blocks;
}

/**
 * Builds a confirmation message after a user interacts with a match
 * @param {Object} matchedUser - The matched user's info
 * @param {String} interactionType - The type of interaction
 * @returns {Array} - Slack blocks for the confirmation message
 */
function buildMatchInteractionConfirmation(matchedUser, interactionType) {
  let confirmationText;
  let emoji;
  
  if (interactionType === 'direct_message') {
    confirmationText = `You've started a direct message with ${matchedUser.real_name || 'your match'}. Happy connecting!`;
    emoji = "✉️";
  } else if (interactionType === 'calendar') {
    confirmationText = `You've scheduled a meeting with ${matchedUser.real_name || 'your match'}. Hope it goes well!`;
    emoji = "📅";
  } else {
    confirmationText = `You've connected with ${matchedUser.real_name || 'your match'}. Great job!`;
    emoji = "🎉";
  }
  
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *Connection Initiated!*`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: confirmationText
      }
    }
  ];
}

module.exports = {
  buildMatchesMessage,
  buildMatchInteractionConfirmation
};
