### README.md

```markdown
# IVAO Flight Monitor Discord Bot

This Discord bot monitors flights from specified airports using the IVAO API and posts messages to a Discord channel for departures.

## Features

- Monitors departures from specified airports.
- Posts messages to a Discord channel when a relevant departure is detected.
- Messages are styled with embeds and use color coding (green for departures).

## Requirements

- Node.js
- NPM (Node Package Manager)

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/ivao-flight-monitor-bot.git
   cd ivao-flight-monitor-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure the bot:**

   Open the `bot.js` file and update the following lines with your Discord bot token and channel ID:

   ```javascript
   // Your Discord Bot Token
   const TOKEN = 'YOUR_DISCORD_BOT_TOKEN';

   // Your Discord Channel ID
   const CHANNEL_ID = 'YOUR_DISCORD_CHANNEL_ID';
   ```

   Replace `YOUR_DISCORD_BOT_TOKEN` with your actual Discord bot token and `YOUR_DISCORD_CHANNEL_ID` with your actual Discord channel ID.

4. **Run the bot:**

   ```bash
   node bot.js
   ```

## Configuration

- **Monitored Airports:** You can modify the list of monitored airports by editing the `MONITORED_AIRPORTS` array in the `bot.js` file.

  ```javascript
  const MONITORED_AIRPORTS = ['OJAI', 'OJAM', 'OSDI', 'ORBI'];
  ```

## Commands

- **!flights:** Get a list of currently monitored flights.

## Code Explanation

The bot uses the following key libraries:
- **discord.js:** For interacting with the Discord API.
- **axios:** For making HTTP requests to the IVAO API.
- **node-cron:** For scheduling the flight monitoring to run every 1 minute.

### Key Functions

- **fetchFlightData:** Fetches flight data from the IVAO API.
- **parseFlightData:** Parses and filters flight data to extract departures from monitored airports.
- **monitorFlights:** Checks for new departures and sends messages to the Discord channel.

### Bot Behavior

- The bot only sends messages for departures from the monitored airports.
- Messages are sent as embeds with a green color for departures.
- The bot ensures no duplicate messages are sent by tracking reported departures.
```

This README provides clear instructions for setting up and running the bot, as well as configuring it to monitor specific airports and handle bot commands.