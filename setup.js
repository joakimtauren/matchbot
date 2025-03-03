/**
 * Setup script for Replit
 */
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file exists, if not create it from .env.example
if (!fs.existsSync('.env')) {
  console.log('Creating .env file from .env.example...');
  
  if (fs.existsSync('.env.example')) {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    fs.writeFileSync('.env', envExample);
    console.log('.env file created successfully!');
  } else {
    console.log('Could not find .env.example file. Creating a basic .env file.');
    fs.writeFileSync('.env', 'SLACK_BOT_TOKEN=\nSLACK_SIGNING_SECRET=\nSLACK_APP_TOKEN=\nDATABASE_URL=\nNODE_ENV=production\n');
  }
}

console.log('\n=== Slack Matcher Bot Setup ===\n');
console.log('This script will help you configure your Slack Matcher Bot on Replit.');
console.log('You will need your Slack Bot Token, Signing Secret, and App Token.');

rl.question('Do you want to configure your app now? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('\nOk! You can manually edit the .env file or add secrets to Replit later.');
    showReplitInstructions();
    rl.close();
    return;
  }

  configureBotCredentials();
});

function configureBotCredentials() {
  rl.question('\nEnter your Slack Bot Token (xoxb-...): ', (slackToken) => {
    process.env.SLACK_BOT_TOKEN = slackToken;
    
    rl.question('Enter your Slack Signing Secret: ', (signingSecret) => {
      process.env.SLACK_SIGNING_SECRET = signingSecret;
      
      rl.question('Enter your Slack App Token (xapp-...): ', (appToken) => {
        process.env.SLACK_APP_TOKEN = appToken;
        
        console.log('\nChecking for Replit Database URL...');
        if (process.env.REPLIT_DB_URL) {
          console.log('Replit database detected! No manual database configuration needed.');
          finishSetup();
        } else {
          console.log('No Replit database detected.');
          rl.question('Do you have a PostgreSQL database URL to use? (yes/no): ', (hasDbUrl) => {
            if (hasDbUrl.toLowerCase() === 'yes') {
              rl.question('Enter your PostgreSQL Database URL: ', (dbUrl) => {
                process.env.DATABASE_URL = dbUrl;
                finishSetup();
              });
            } else {
              console.log('\nYou will need to set up a PostgreSQL database in your Replit project.');
              console.log('1. Go to your Replit project dashboard');
              console.log('2. Click on "Secrets" (lock icon)');
              console.log('3. Add a new secret with key "DATABASE_URL" and your PostgreSQL connection string');
              finishSetup();
            }
          });
        }
      });
    });
  });
}

function finishSetup() {
  // Save environment variables to .env file
  const envContent = `SLACK_BOT_TOKEN=${process.env.SLACK_BOT_TOKEN || ''}
SLACK_SIGNING_SECRET=${process.env.SLACK_SIGNING_SECRET || ''}
SLACK_APP_TOKEN=${process.env.SLACK_APP_TOKEN || ''}
DATABASE_URL=${process.env.DATABASE_URL || process.env.REPLIT_DB_URL || ''}
NODE_ENV=production
PORT=3000
`;

  fs.writeFileSync('.env', envContent);
  console.log('\nConfiguration saved to .env file.');
  
  // Ask about running migrations
  rl.question('\nDo you want to run database migrations now? (yes/no): ', (runMigrations) => {
    if (runMigrations.toLowerCase() === 'yes') {
      console.log('\nRunning database migrations...');
      try {
        execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
        console.log('Migrations completed successfully!');
      } catch (error) {
        console.error('Error running migrations:', error.message);
        console.log('You can run migrations later with "npm run db:migrate"');
      }
    }
    
    showReplitInstructions();
    rl.close();
  });
}

function showReplitInstructions() {
  console.log('\n=== Next Steps ===');
  console.log('1. Start the application by clicking the "Run" button or running "npm start"');
  console.log('2. Make sure your Slack app has the following scopes:');
  console.log('   - channels:read, channels:history, groups:read');
  console.log('   - chat:write, users:read, users:read.email, im:write');
  console.log('3. Configure your Slack app\'s Event Subscriptions for these events:');
  console.log('   - team_join, user_profile_changed');
  console.log('   - member_joined_channel, member_left_channel');
  console.log('4. Add slash commands to your Slack app:');
  console.log('   - /match - Find matches in the current channel');
  console.log('   - /opt-out - Opt out of matching');
  console.log('   - /opt-in - Opt in to matching');
  console.log('\nYour Slack Matcher Bot is ready to run on Replit!');
}
