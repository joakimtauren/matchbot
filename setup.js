/**
 * Simple setup script for Replit
 */
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if .env file exists, if not create it from .env.example
if (!fs.existsSync('.env')) {
  console.log('Creating .env file from .env.example...');
  const envExample = fs.readFileSync('.env.example', 'utf8');
  fs.writeFileSync('.env', envExample);
  console.log('.env file created successfully!');
}

console.log('\n=== Slack Matcher Bot Setup ===\n');
console.log('This script will help you configure your Slack Matcher Bot on Replit.');
console.log('You will need your Slack Bot Token, Signing Secret, and App Token.');
console.log('You will also need a MongoDB connection string.\n');

rl.question('Do you want to configure your app now? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('\nOk! You can manually edit the .env file later.');
    rl.close();
    return;
  }

  let envContent = '';

  rl.question('\nEnter your Slack Bot Token (xoxb-...): ', (slackToken) => {
    envContent += `SLACK_BOT_TOKEN=${slackToken}\n`;

    rl.question('Enter your Slack Signing Secret: ', (signingSecret) => {
      envContent += `SLACK_SIGNING_SECRET=${signingSecret}\n`;

      rl.question('Enter your Slack App Token (xapp-...): ', (appToken) => {
        envContent += `SLACK_APP_TOKEN=${appToken}\n`;

        rl.question('Enter your MongoDB Connection URI: ', (mongoUri) => {
          envContent += `MONGODB_URI=${mongoUri}\n`;
          envContent += `PORT=3000\n`;
          envContent += `NODE_ENV=production\n`;

          // Write the new .env file
          fs.writeFileSync('.env', envContent);
          console.log('\nConfiguration saved to .env file.');
          console.log('You can run the bot with "npm start".');
          rl.close();
        });
      });
    });
  });
});

rl.on('close', () => {
  console.log('\nSetup complete! Your Slack Matcher Bot is ready to run on Replit.');
  process.exit(0);
});
