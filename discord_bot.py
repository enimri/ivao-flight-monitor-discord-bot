import discord
import aiohttp
import asyncio
import logging
import os
import datetime
from discord.ext import commands, tasks
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID"))

# Monitored Airports
MONITORED_AIRPORTS = [
    "OSDI", "OSAP", "OSDZ", "OSLK", "ORBI", "ORAA", "ORMM", 
    "ORSU", "OJAI", "OJAM", "OJAQ", "OSKL", "ORNI"
]

# Map ICAO to country flag emoji
AIRPORT_FLAGS = {
    "OSDI": "🇸🇾", "OSAP": "🇸🇾", "OSDZ": "🇸🇾", "OSLK": "🇸🇾", "OSKL": "🇸🇾",
    "ORBI": "🇮🇶", "ORAA": "🇮🇶", "ORMM": "🇮🇶", "ORSU": "🇮🇶", "ORNI": "🇮🇶",
    "OJAI": "🇯🇴", "OJAM": "🇯🇴", "OJAQ": "🇯🇴"
}

# Configure logging
logging.basicConfig(level=logging.INFO)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

reported_flights = set()

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

def get_flag(icao_code):
    return AIRPORT_FLAGS.get(icao_code, "")

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

    dep_flag = get_flag(flight.get("departure"))
    arr_flag = get_flag(flight.get("arrival"))

    embed.add_field(name="🛫 Departure", value=f"{flight.get('departure') or 'N/A'} {dep_flag}", inline=True)
    embed.add_field(name="🛬 Arrival", value=f"{flight.get('arrival') or 'N/A'} {arr_flag}", inline=True)
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
        if flight_id in reported_flights:
            continue

        embed = build_flight_embed(flight)
        channel = bot.get_channel(CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            reported_flights.add(flight_id)
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

@tasks.loop(hours=3)
async def clear_reported_flights():
    reported_flights.clear()
    logging.info("Cleared reported_flights cache.")

bot.run(TOKEN)
