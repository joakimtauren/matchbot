# Slack Matcher Bot

A Slack WebSocket-based bot that matches users from within specific channels.

## Replit Setup Instructions

### 1. Create a new Replit project
- Fork this repository or create a new Node.js project on Replit
- Import all the files

### 2. Set up MongoDB
- Create a MongoDB Atlas account if you don't have one
- Create a new cluster and database
- Get your connection string

### 3. Configure Environment Variables
- In your Replit project, click on "Secrets" (lock icon) in the sidebar
- Add the following secrets:
  - `SLACK_BOT_TOKEN`: Your Slack bot token (starts with xoxb-)
  - `SLACK_SIGNING_SECRET`: Your Slack app signing secret
  - `SLACK_APP_TOKEN`: Your Slack app-level token (starts with xapp-)
  - `MONGODB_URI`: Your MongoDB connection string
  - `NODE_ENV`: Set to "production"

### 4. Run the Setup Script (Optional)
