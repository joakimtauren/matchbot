# Slack Matcher Bot (PostgreSQL Version)

A Slack WebSocket-based bot that matches users from within specific channels, designed to run on Replit with PostgreSQL.

## Features
- Match users within specific Slack channels
- Cross-company matching prioritized
- Similar role matching
- Opt-out functionality
- Direct messaging and calendar scheduling options

## Commands
- `/match` - Find new matches in the current channel
- `/opt-out` - Stop receiving matches
- `/opt-in` - Start receiving matches again

## Replit Setup Instructions

### 1. Create a new Replit project
- Fork this repository or create a new Node.js project on Replit
- Import all the files

### 2. Set up PostgreSQL Database
- In your Replit project, click on "Database" in the sidebar
- Create a new PostgreSQL database
- Your database connection URL will be automatically available

### 3. Configure Environment Variables
- In your Replit project, click on "Secrets" (lock icon) in the sidebar
- Add the following secrets:
  - `SLACK_BOT_TOKEN`: Your Slack bot token (starts with xoxb-)
  - `SLACK_SIGNING_SECRET`: Your Slack app signing secret
  - `SLACK_APP_TOKEN`: Your Slack app-level token (starts with xapp-)
  - `NODE_ENV`: Set to "production"

### 4. Run the Setup Script
