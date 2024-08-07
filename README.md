### README.md

```markdown
# IVAO Flight Monitor Discord Bot

This Discord bot monitors flights from specified airports using the IVAO API and posts messages to a Discord channel for departures and arrivals.

## Features

- Monitors departures and arrivals from specified airports.
- Posts messages to a Discord channel when a relevant departure and arrivals is detected.
- Messages are styled with embeds and use color coding (green for departures and orange for arrivals).

## Requirements

- Node.js
- NPM (Node Package Manager)
  ```
## Setup

1. **Clone the repository:**

 make a subdomian 

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

4. ** Test Run the bot:**

   ```bash
   node bot.js
   ```
 

   Run the bot  24/7 

```bash
go to Node.js 
Document Root will be  /pilot.yourdivsion.ivao.aero
Application Root will be  /pilot.xm.ivao.aero
Application Startup File will be bot.js
then press +npm install wait until its finish 
then go to Run Node.js commands
and prsss and right in blink run start
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
- **parseFlightData:** Parses and filters flight data to extract departures and arrivals from monitored airports.
- **monitorFlights:** Checks for new departures, arrivals and sends messages to the Discord channel.

### Bot Behavior

- The bot sends messages for departures and arrivals from the monitored airports.
- Messages are sent as embeds with a green color for departures and orange color for arrivals.
- The bot ensures no duplicate messages are sent by tracking reported departures and arrivals.
```

This README provides clear instructions for setting up and running the bot, as well as configuring it to monitor specific airports and handle bot commands.
