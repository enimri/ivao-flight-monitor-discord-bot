const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

const TOKEN = 'your-discord-bot-token';
const CHANNEL_ID = 'your-discord-channel-id';
const MONITORED_AIRPORTS = ['OJAI', 'OJAM', 'OSDI', 'ORBI'];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let lastChecked = new Date();
let reportedFlights = new Set();

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

function parseFlightData(data) {
    if (!data || !data.clients) {
        console.error('Invalid data structure:', data);
        return [];
    }
    const flights = data.clients.pilots || [];
    console.log(`Parsed flight data: ${flights.length} flights`);
    return flights
        .filter(flight => flight.flightPlan && (MONITORED_AIRPORTS.includes(flight.flightPlan.departureId) || MONITORED_AIRPORTS.includes(flight.flightPlan.arrivalId)))
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
        const flightId = `${flight.callsign}-${flight.departure}-${flight.arrival}`;

        if (MONITORED_AIRPORTS.includes(flight.departure) && MONITORED_AIRPORTS.includes(flight.arrival) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending combined message for flight ${flight.callsign} from ${flight.departure} to ${flight.arrival}`);
            const embed = new EmbedBuilder()
                .setColor(0x0000FF)
                .setTitle('Departure and Arrival')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Combined message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000);
                })
                .catch(err => console.error('Error sending combined message:', err));
        } else if (MONITORED_AIRPORTS.includes(flight.departure) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending departure message for flight ${flight.callsign} from ${flight.departure}`);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Departure')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Departure message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000);
                })
                .catch(err => console.error('Error sending departure message:', err));
        } else if (MONITORED_AIRPORTS.includes(flight.arrival) && now > lastChecked && !reportedFlights.has(flightId)) {
            console.log(`Sending arrival message for flight ${flight.callsign} at ${flight.arrival}`);
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('Arrival')
                .setDescription(`ID: ${flight.userId}, Departure: ${flight.departure}, Arrival: ${flight.arrival}, Callsign: ${flight.callsign}.`);

            client.channels.cache.get(CHANNEL_ID).send({ embeds: [embed] })
                .then(message => {
                    console.log('Arrival message sent');
                    reportedFlights.add(flightId);
                    setTimeout(() => message.delete().catch(console.error), 24 * 60 * 60 * 1000);
                })
                .catch(err => console.error('Error sending arrival message:', err));
        }
    });

    lastChecked = new Date();
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Bot is now online!');

    cron.schedule('* * * * *', () => {
        monitorFlights();
    });
});

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

client.login(TOKEN);
