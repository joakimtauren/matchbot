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
  try {
    await db.connect();
    
    // Get a dynamic port for Replit or use the configured port
    const port = process.env.PORT || 3000;
    await app.start(port);
    
    logger.info(`⚡️ Bolt app is running on port ${port}!`);
    
    // Initial sync of users from all channels the bot is in
    try {
      const syncService = require('./services/slack-sync');
      await syncService.initialSync(app.client);
      logger.info('Initial user sync completed');
    } catch (error) {
      logger.error('Error during initial sync:', error);
    }
  } catch (error) {
    logger.error('Error starting app:', error);
    process.exit(1);
  }
})();

// Required for Replit to keep the app running
if (process.env.REPLIT_DB_URL) {
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Slack matcher bot is running!');
  });
  server.listen(3001);
}
