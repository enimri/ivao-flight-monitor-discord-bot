# Discord Flight Monitoring Bot

This Discord bot monitors flights from specific airports and posts updates to a designated channel. It uses the IVAO API to fetch flight data and posts updates for departures and arrivals.

## Features

- Monitors flights from a set of predefined airports.
- Sends updates to a specific Discord channel for flight departures and arrivals.
- Uses `cron` to schedule flight checks every minute.
- Utilizes `pm2` to keep the bot running continuously.

## Prerequisites

- Node.js installed on your Plesk server.
- A Discord bot token.
- Access to your Plesk server (via Plesk dashboard or SSH).

## Installation

### Step 1: Set Up Node.js on Plesk

1. **Install Node.js**:
   - Go to **Tools & Settings** in the Plesk dashboard.
   - Click on **Updates and Upgrades**.
   - Click on **Add/Remove Components**.
   - Find **Node.js** and install it.

2. **Create a Node.js Application**:
   - Go to **Websites & Domains** and select the domain where you want to host your bot.
   - Click on **Node.js** and then click on **Enable Node.js**.

### Step 2: Upload Your Bot Files

1. **Upload `bot.js` and `package.json`**:
   - Navigate to **Files** in the Plesk dashboard.
   - Go to your domain's directory (usually under `httpdocs`).
   - Upload `bot.js` and `package.json` files to this directory.

### Step 3: Install Dependencies

1. **Open a Terminal in Plesk**:
   - Navigate to your domain in the Plesk dashboard.
   - Click on **Web Hosting Access** to get the SSH credentials (if not already available).
   - Use an SSH client (like PuTTY) to connect to your server, or use the **Web SSH** option in Plesk.

2. **Install Dependencies**:
   - Navigate to your domain's directory where you uploaded your files. For example:
     ```sh
     cd /var/www/vhosts/yourdomain.com/httpdocs
     ```
   - Run the following command to install the required dependencies:
     ```sh
     npm install
     ```

### Step 4: Configure `bot.js`

1. **Modify `bot.js`**:
   - Open the `bot.js` file in a text editor.
   - Replace `const TOKEN = process.env.DISCORD_TOKEN;` with `const TOKEN = 'your-discord-bot-token';`.
   - Replace `const CHANNEL_ID = '1270049435652722741';` with your actual Discord channel ID.

### Step 5: Set Up a Process Manager

To ensure your bot runs continuously, even after reboots, use a process manager like `pm2`.

1. **Install `pm2` Globally**:
   - In your SSH terminal, run the following command:
     ```sh
     npm install -g pm2
     ```

2. **Start Your Bot with `pm2`**:
   - Navigate to your bot's directory if not already there.
   - Start your bot with `pm2`:
     ```sh
     pm2 start bot.js
     ```

3. **Save the `pm2` Process List and Enable Startup Script**:
   - Save the process list so `pm2` can automatically start your bot on server reboots:
     ```sh
     pm2 save
     ```
   - Set up the startup script to run `pm2` on server boot:
     ```sh
     pm2 startup
     ```
   - Follow the instructions provided by `pm2` to complete the setup. This usually involves running a command that `pm2` outputs.

## Usage

1. **Start the Bot**:
   - If not already started, navigate to your bot's directory and start the bot using `pm2`:
     ```sh
     pm2 start bot.js
     ```

2. **Monitor Flights**:
   - The bot will automatically monitor flights from the specified airports and send updates to the designated Discord channel.

3. **Commands**:
   - Use `!flights` in the designated Discord channel to get the current monitored flights.

## License

This project is licensed under the MIT License.
```
