# Discord Flight Monitoring Bot



### Setup
MAKE A SUB DOMIAN
1.Go To File Sub Domain and upload it and extract it
go to discord Developer and make a bot


```
### Config

```bash
{
    "token": "<Bot Token>", will find it in .env
    "channel": "<Channel ID>", will find it in .env
    "airport_prefixes": ["OJAI", "OSDI",] #CHANGE DESIRE AIRPORT ONLY PUT THE ICAO OF THE AIRPORT
}

bot must have : bot ,view channels ,  send messages ,  embed links ,  read message history

 After editing Code go SSH and CD pilot.yourdivison.ivao.aero
 then run 
```
test code 

Linux
```bash
  python3 bot.py
```
if everything works use this code to keep the bot online
```bash
  screen -dmS bot-name python3.9 bot.py
```
## Bot Behavior

- **Monitoring**: The bot checks for flights every minute using a `cron` job.
- **Flight Notifications**: Sends notifications for departures and arrivals from/to monitored airports.
  - **Departure Notifications**: Embed color is green (`#00FF00`).
  - **Arrival Notifications**: Embed color is orange (`#FFA500`).
  - **check  flight manually**: code will be **!checkflights**
## License

This project is licensed under the MIT License.
