require('dotenv').config();
const { App } = require('@slack/bolt');
const db = require('./db');
const commandHandlers = require('./handlers/commands');
const eventHandlers = require('./handlers/events');
const logger = require('./utils/logger');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      path: '/health',
      method: ['GET'],
      handler: (req, res) => {
        res.writeHead(200);
        res.end('Health check: OK');
      },
    },
  ],
});

// Register command handlers
app.command('/match', commandHandlers.matchCommand);
app.command('/opt-out', commandHandlers.optOutCommand);
app.command('/opt-in', commandHandlers.optInCommand);

// Register action handlers
app.action('send_dm', commandHandlers.sendDirectMessage);
app.action('open_calendar', commandHandlers.openCalendar);

// Register event handlers
app.event('team_join', eventHandlers.teamJoin);
app.event('user_profile_changed', eventHandlers.profileChanged);
app.event('member_joined_channel', eventHandlers.memberJoinedChannel);
app.event('member_left_channel', eventHandlers.memberLeftChannel);

// Start the app
(async () => {
  await db.connect();
  await app.start(process.env.PORT || 3000);
  logger.info('⚡️ Bolt app is running!');
  
  // Initial sync of users from all channels the bot is in
  try {
    const syncService = require('./services/slack-sync');
    await syncService.initialSync(app.client);
    logger.info('Initial user sync completed');
  } catch (error) {
    logger.error('Error during initial sync:', error);
  }
})();
