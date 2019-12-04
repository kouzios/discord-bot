# discord-bot
My discord bot, intended for jokes between friends - but you can add it to your server [here](https://discordapp.com/oauth2/authorize?client_id=642967654683901963&permissions=36702208&scope=bot)

# How to use the code itself?

0: Have node installed on your machine, along with npm. At least version 8.13, due to some dependancies.

1: Install FFMPEG (dependant on system type)

2: npm i

3: add auth.json based on copy.auth.json format - the key being the discord auth key

4: add .env based on copy.env

5: add google-credentials.json from the private key retrieved from your google cloud speech-to-text project

Then you can add it to your discord server via the [developer apps portal](https://discordapp.com/developers/applications/) for discord, populating auth.json with the discord auth key provided by that app bot.

# Avaliable Commands?

```
# Flames a user, truly a savage maneuver
!flame [user]
```

and

```
# Plays a suplex audio file, clipped from Kemono Michi: Rise Up
!suplex
```
