const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

// Your Discord Bot Token
const TOKEN = 'YOUR_BOT_DISCORD ';

// Your Discord Channel ID
const CHANNEL_ID = 'DISCORD_CHANNEL';

// Airports to monitor
const MONITORED_AIRPORTS = ['OJAI', 'OJAM', 'OSDI', 'ORBI'];

// Create a new client instance with the correct intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let lastChecked = new Date();
let reportedDepartures = new Set();
let reportedArrivals = new Set();

// Fetch flight data from IVAO API
async function fetchFlightData() {
    try {
        const response = await axios.get('https://api.ivao.aero/v2/tracker/whazzup');
        return response.data;
    } catch (error) {
        console.error('Error fetching flight data:', error);
        return null;
    }
}

// Parse flight data to extract departures and arrivals
function parseFlightData(data) {
    if (!data || !data.clients) {
        return [];
    }
    const flights = data.clients.pilots || [];
    return flights
        .filter(flight => flight.flightPlan && (MONITORED_AIRPORTS.includes(flight.flightPlan.departureId) || MONITORED_AIRPORTS.includes(flight.flightPlan.arrivalId)))
        .map(flight => ({
            userId: flight.userId,
            callsign: flight.callsign,
            departure: flight.flightPlan.departureId,
            arrival: flight.flightPlan.arrivalId
        }));
}

// Monitor flights and send messages to Discord
async function monitorFlights() {
    const data = await fetchFlightData();
    if (!data) {
        return;
    }
    const flights = parseFlightData(data);

    flights.forEach(flight => {
        const now = new Date();
        const departureId = `${flight.callsign}-${flight.departure}`;
        const arrivalId = `${flight.callsign}-${flight.arrival}`;

        // If the flight's departure airport is monitored and it's a new departure
        if (MONITORED_AIRPORTS.includes(flight.departure) && now > lastChecked && !reportedDepartures.has(departureId)) {
            client.channels.cache.get(CHANNEL_ID).send(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`)
                .then(() => {
                    reportedDepartures.add(departureId);
                })
                .catch(err => console.error('Error sending departure message:', err));
        }

        // If the flight's arrival airport is monitored, it's a new arrival, and no departure message has been sent
        if (MONITORED_AIRPORTS.includes(flight.arrival) && now > lastChecked && !reportedArrivals.has(arrivalId) && !reportedDepartures.has(departureId)) {
            client.channels.cache.get(CHANNEL_ID).send(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`)
                .then(() => {
                    reportedArrivals.add(arrivalId);
                })
                .catch(err => console.error('Error sending arrival message:', err));
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
