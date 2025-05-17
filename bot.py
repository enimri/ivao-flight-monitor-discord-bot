import discord
import aiohttp
import asyncio
import logging
import os
import csv
import datetime
import time
from discord.ext import commands, tasks
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID"))

# Load ICAO flag + airport name mapping
def load_icao_metadata(csv_file):
    def to_flag(code):
        return chr(ord(code[0]) + 127397) + chr(ord(code[1]) + 127397)

    mapping = {}
    try:
        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                icao = row.get('icao')
                country_code = row.get('country_code')
                airport_name = row.get('airport')
                if icao and country_code and airport_name and len(country_code) == 2:
                    flag = to_flag(country_code.strip().upper())
                    mapping[icao.strip().upper()] = f"{flag} {icao.strip().upper()} - {airport_name.strip()}"
    except Exception as e:
        logging.error(f"Failed to load ICAO metadata: {e}")
    return mapping

ICAO_METADATA = load_icao_metadata("iata-icao.csv")

# Monitored Airports
MONITORED_AIRPORTS = [
    "OSDI", "OSAP", "OSDZ", "OSLK", "ORBI", "ORAA", "ORMM", 
    "ORSU", "OJAI", "OJAM", "OJAQ", "OSKL", "ORNI"
]

# Configure logging
logging.basicConfig(level=logging.INFO)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Flight report tracking with timestamp
reported_flights = {}  # flight_id -> timestamp

async def fetch_flight_data():
    url = "https://api.ivao.aero/v2/tracker/whazzup"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
    except Exception as e:
        logging.error(f"Error fetching flight data: {e}")
    return None

def get_airport_display(icao_code):
    return ICAO_METADATA.get(icao_code, f"{icao_code or 'N/A'}")

def parse_flight_data(data):
    if not data or "clients" not in data or "pilots" not in data["clients"]:
        return []

    flights = data["clients"]["pilots"]
    return [
        {
            "userId": flight["userId"],
            "callsign": flight["callsign"],
            "departure": flight["flightPlan"].get("departureId"),
            "arrival": flight["flightPlan"].get("arrivalId"),
            "aircraft": flight["flightPlan"].get("aircraftId"),
            "cruise": flight["flightPlan"].get("level"),
            "route": flight["flightPlan"].get("route"),
            "remarks": flight["flightPlan"].get("remarks")
        }
        for flight in flights
        if flight.get("flightPlan") and (
            flight["flightPlan"].get("departureId") in MONITORED_AIRPORTS or
            flight["flightPlan"].get("arrivalId") in MONITORED_AIRPORTS
        )
    ]

def build_flight_embed(flight, mode="Update"):
    embed = discord.Embed(
        title=f"IVAO {mode}: {flight['callsign']}",
        color=0x00bfff if mode == "Update" else 0x00ff00,
        timestamp=datetime.datetime.utcnow()
    )
    embed.add_field(name="✈️ Callsign", value=flight['callsign'], inline=True)
    embed.add_field(name="🛫 Departure", value=get_airport_display(flight.get("departure")), inline=True)
    embed.add_field(name="🛬 Arrival", value=get_airport_display(flight.get("arrival")), inline=True)
    embed.add_field(name="🛩 Aircraft", value=flight.get('aircraft') or "N/A", inline=True)

    cruise = flight.get('cruise')
    embed.add_field(name="🧭 Cruise FL", value=cruise if cruise else "Not Filed", inline=True)

    route = flight.get('route') or "N/A"
    embed.add_field(name="🗺 Route", value=route[:1000], inline=False)

    if flight.get('remarks'):
        embed.add_field(name="📝 Remarks", value=flight['remarks'][:1000], inline=False)

    embed.set_footer(text="XM IVAO • IVAO Flight Monitor")
    return embed

async def monitor_flights():
    logging.info("Checking flights...")
    data = await fetch_flight_data()
    if not data:
        logging.warning("No data received.")
        return

    flights = parse_flight_data(data)
    logging.info(f"Found {len(flights)} relevant flights.")

    for flight in flights:
        flight_id = f"{flight['userId']}-{flight['callsign']}"
        now = time.time()

        # Skip if already reported in the last 3 hours (10800 seconds)
        if flight_id in reported_flights and now - reported_flights[flight_id] < 10800:
            continue

        embed = build_flight_embed(flight)
        channel = bot.get_channel(CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            reported_flights[flight_id] = now
            logging.info(f"Reported flight: {flight_id}")

@bot.command(name="checkflights")
async def check_flights(ctx):
    data = await fetch_flight_data()
    if not data:
        await ctx.send("Error fetching flight data.")
        return

    flights = parse_flight_data(data)
    if not flights:
        await ctx.send("No relevant flights found.")
        return

    for flight in flights:
        embed = build_flight_embed(flight, mode="Manual Check")
        await ctx.send(embed=embed)

@bot.event
async def on_ready():
    logging.info(f"Logged in as {bot.user}!")
    logging.info("Starting flight monitoring...")
    flight_monitoring.start()
    clear_reported_flights.start()

@tasks.loop(minutes=1)
async def flight_monitoring():
    await monitor_flights()

@tasks.loop(minutes=10)
async def clear_reported_flights():
    now = time.time()
    expired = [fid for fid, ts in reported_flights.items() if now - ts > 10800]

    for fid in expired:
        del reported_flights[fid]

    if expired:
        logging.info(f"Cleaned up {len(expired)} expired reported flights.")

bot.run(TOKEN)
