const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

// Your Discord Bot Token
const TOKEN = 'YOUR_DISCORD_BOT_TOKEN'; // Replace with your new bot token

// Your Discord Channel ID
const CHANNEL_ID = 'YOUR_DISCORD_CHANNEL_ID';

// Airports to monitor
const MONITORED_AIRPORTS = ['OJAI', 'OJAM', 'OSDI', 'ORBI'];

// Create a new client instance with the correct intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let lastChecked = new Date();
let reportedDepartures = new Set();

// Fetch flight data from IVAO API
async function fetchFlightData() {
    try {
        console.log('Fetching flight data...');
        const response = await axios.get('https://api.ivao.aero/v2/tracker/whazzup');
        console.log('Fetched flight data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching flight data:', error);
        return null;
    }
}

// Parse flight data to extract departures
function parseFlightData(data) {
    if (!data || !data.clients) {
        console.error('Invalid data structure:', data);
        return [];
    }
    const flights = data.clients.pilots || [];
    console.log(`Parsed flight data: ${flights.length} flights`);
    return flights
        .filter(flight => flight.flightPlan && MONITORED_AIRPORTS.includes(flight.flightPlan.departureId))
        .map(flight => {
            console.log('Flight data structure:', flight);
            return {
                userId: flight.userId,
                callsign: flight.callsign,
                departure: flight.flightPlan.departureId,
                arrival: flight.flightPlan.arrivalId
            };
        });
}

// Monitor flights and send messages to Discord
async function monitorFlights() {
    console.log('Checking for flights...');
    const data = await fetchFlightData();
    if (!data) {
        console.error('No data received from API');
        return;
    }
    const flights = parseFlightData(data);

    console.log(`Filtered flights: ${flights.length} flights`);

    flights.forEach(flight => {
        const now = new Date();
        const departureId = `${flight.callsign}-${flight.departure}`;

        // If the flight's departure airport is monitored and it's a new departure
        if (MONITORED_AIRPORTS.includes(flight.departure) && now > lastChecked && !reportedDepartures.has(departureId)) {
            console.log(`Sending departure message for flight ${flight.callsign} from ${flight.departure}`);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00) // Green color for departure
                .setTitle('Departure')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(() => {
                    console.log('Departure message sent');
                    reportedDepartures.add(departureId);
                })
                .catch(err => console.error('Error sending departure message:', err));
        }
    });

    lastChecked = new Date();
}

// On bot ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is now online!');

    // Schedule the flight monitoring to run every 1 minute
    cron.schedule('* * * * *', () => {
        monitorFlights();
    });
});

// On message create (example command to get current flights)
client.on('messageCreate', async message => {
    if (message.content === '!flights') {
        console.log('Received !flights command');
        const data = await fetchFlightData();
        if (!data) {
            message.channel.send('Error fetching flight data.');
            return;
        }
        const flights = parseFlightData(data);

        let response = 'Current flights:\n';
        flights.forEach(flight => {
            response += `ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.\n`;
        });

        message.channel.send(response);
    }
});

// Login to Discord
client.login(TOKEN);
