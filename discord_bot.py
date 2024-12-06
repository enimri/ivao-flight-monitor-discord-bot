import discord
import aiohttp
import asyncio
from discord.ext import commands, tasks

# Bot Token and Channel ID
TOKEN = "Discord_token"
CHANNEL_ID = "CHANNEL_ID"

# Monitored Airports
MONITORED_AIRPORTS = [
    "OSDI", "OSAP", "OSDZ", "OSLK", "ORBI", "ORAA", "ORMM",
    "ORSU", "OJAI", "OJAM", "OJAQ", "OSKL", "ORNI"
]

# Create Intents and Client
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Set for flights already reported
reported_flights = set()

async def fetch_flight_data():
    """Fetches flight data from IVAO API."""
    url = "https://api.ivao.aero/v2/tracker/whazzup"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
    except Exception as e:
        print(f"Error fetching flight data: {e}")
    return None

def parse_flight_data(data):
    """Parses flight data to extract relevant information."""
    if not data or "clients" not in data or "pilots" not in data["clients"]:
        return []

    flights = data["clients"]["pilots"]
    return [
        {
            "userId": flight["userId"],
            "callsign": flight["callsign"],
            "departure": flight["flightPlan"]["departureId"],
            "arrival": flight["flightPlan"]["arrivalId"]
        }
        for flight in flights
        if flight.get("flightPlan") and (
            flight["flightPlan"]["departureId"] in MONITORED_AIRPORTS or
            flight["flightPlan"]["arrivalId"] in MONITORED_AIRPORTS
        )
    ]

async def monitor_flights():
    """Checks for flights and sends messages to Discord."""
    print("Checking flights...")
    data = await fetch_flight_data()
    if not data:
        print("No data received.")
        return

    flights = parse_flight_data(data)
    print(f"Found {len(flights)} relevant flights.")

    for flight in flights:
        flight_id = f"{flight['callsign']}-{flight['departure']}-{flight['arrival']}"
        if flight_id in reported_flights:
            continue

        if flight["departure"] in MONITORED_AIRPORTS and flight["arrival"] in MONITORED_AIRPORTS:
            embed = discord.Embed(
                title="Departure and Arrival",
                description=(f"ID: {flight['userId']}\n"
                             f"Callsign: {flight['callsign']}\n"
                             f"Departure: {flight['departure']}\n"
                             f"Arrival: {flight['arrival']}"),
                color=0x0000FF
            )
        elif flight["departure"] in MONITORED_AIRPORTS:
            embed = discord.Embed(
                title="Departure",
                description=(f"ID: {flight['userId']}\n"
                             f"Callsign: {flight['callsign']}\n"
                             f"Departure: {flight['departure']}\n"
                             f"Arrival: {flight['arrival']}"),
                color=0x00FF00
            )
        elif flight["arrival"] in MONITORED_AIRPORTS:
            embed = discord.Embed(
                title="Arrival",
                description=(f"ID: {flight['userId']}\n"
                             f"Callsign: {flight['callsign']}\n"
                             f"Departure: {flight['departure']}\n"
                             f"Arrival: {flight['arrival']}"),
                color=0xFFA500
            )
        else:
            continue

        # Send the message
        channel = bot.get_channel(int(CHANNEL_ID))
        if channel:
            await channel.send(embed=embed)
            reported_flights.add(flight_id)
            print(f"Reported flight: {flight_id}")

@bot.command(name="checkflights")
async def check_flights(ctx):
    """Command to manually check the flights."""
    data = await fetch_flight_data()
    if not data:
        await ctx.send("Error fetching flight data.")
        return

    flights = parse_flight_data(data)
    if not flights:
        await ctx.send("No relevant flights found.")
        return

    for flight in flights:
        flight_info = (
            f"Callsign: {flight['callsign']}\n"
            f"Departure: {flight['departure']}\n"
            f"Arrival: {flight['arrival']}\n"
        )
        await ctx.send(flight_info)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}!")
    print("Starting flight monitoring...")
    flight_monitoring.start()

@tasks.loop(minutes=1)
async def flight_monitoring():
    await monitor_flights()

bot.run(TOKEN)
