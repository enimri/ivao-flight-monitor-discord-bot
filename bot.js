const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

// Your Discord Bot Token
const TOKEN = 'YOUR_DISCORD_BOT_TOKEN';

// Your Discord Channel ID
const CHANNEL_ID = 'YOUR_CHANNEL_ID';

// Airports to monitor
const MONITORED_AIRPORTS = ['OJAI', 'OJAM', 'OSDI', 'ORBI'];

// Create a new client instance with the correct intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let lastChecked = new Date();
let reportedFlights = new Set();

// Fetch flight data from IVAO API
async function fetchFlightData() {
    try {
        console.log('Fetching flight data...'); // Debugging line
        const response = await axios.get('https://api.ivao.aero/v2/tracker/whazzup');
        console.log('Fetched flight data:', response.data); // Debugging line
        return response.data;
    } catch (error) {
        console.error('Error fetching flight data:', error);
        return null;
    }
}

// Parse flight data to extract departures and arrivals
function parseFlightData(data) {
    if (!data || !data.clients) {
        console.error('Invalid data structure:', data);
        return [];
    }
    const flights = data.clients.pilots || [];
    console.log(`Parsed flight data: ${flights.length} flights`); // Debugging line
    return flights
        .filter(flight => flight.flightPlan && (MONITORED_AIRPORTS.includes(flight.flightPlan.departureId) || MONITORED_AIRPORTS.includes(flight.flightPlan.arrivalId)))
        .map(flight => {
            console.log('Flight data structure:', flight); // Debugging line
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
    console.log('Checking for flights...'); // Debugging line
    const data = await fetchFlightData();
    if (!data) {
        console.error('No data received from API');
        return;
    }
    const flights = parseFlightData(data);

    console.log(`Filtered flights: ${flights.length} flights`); // Debugging line

    flights.forEach(flight => {
        const now = new Date();
        const flightId = `${flight.callsign}-${flight.departure}-${flight.arrival}`;

        // If the flight is both departing from and arriving at monitored airports
        if (MONITORED_AIRPORTS.includes(flight.departure) && MONITORED_AIRPORTS.includes(flight.arrival) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending combined message for flight ${flight.callsign} from ${flight.departure} to ${flight.arrival}`); // Debugging line
            const embed = new EmbedBuilder()
                .setColor(0x0000FF) // Blue color for both departure and arrival
                .setTitle('Departure and Arrival')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Combined message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000); // Delete message after 24 hours
                })
                .catch(err => console.error('Error sending combined message:', err));
        }

        // If the flight's departure airport is monitored and it's a new departure
        else if (MONITORED_AIRPORTS.includes(flight.departure) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending departure message for flight ${flight.callsign} from ${flight.departure}`); // Debugging line
            const embed = new EmbedBuilder()
                .setColor(0x00FF00) // Green color for departure
                .setTitle('Departure')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Departure message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000); // Delete message after 24 hours
                })
                .catch(err => console.error('Error sending departure message:', err));
        }

        // If the flight's arrival airport is monitored, it's a new arrival, and no departure message has been sent
        else if (MONITORED_AIRPORTS.includes(flight.arrival) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending arrival message for flight ${flight.callsign} at ${flight.arrival}`); // Debugging line
            const embed = new EmbedBuilder()
                .setColor(0xFFA500) // Orange color for arrival
                .setTitle('Arrival')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Arrival message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000); // Delete message after 24 hours
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
        console.log('Received !flights command'); // Debugging line
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
