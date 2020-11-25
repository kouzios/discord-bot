# discord-bot
My discord bot, intended for jokes between friends - but you can add it to your server [here](https://discordapp.com/oauth2/authorize?client_id=642967654683901963&permissions=36702208&scope=bot)

# How to use the code itself?

0: Have node [^8.13.0 or >= 10.10.0] installed on your machine, along with npm. 

1: Install FFMPEG (dependant on system type)

2: Run `npm install` to install node's dependencies

3: Add `auth.json` based on `copy.auth.json` format - the key being the discord auth key

4: add `.env` based on `copy.env`

5. Create a Google cloud speech-to-text project, and create a public/private key pair

5: Download the key file as JSON format, and name it as `google-credentials.json` at the topmost level of the project

6. Add it to your discord server via the [developer apps portal](https://discordapp.com/developers/applications/), populating your `auth.json` with the discord Token provided under the application's bot tab

7. Under the Oauth2 tab, select your desired permissions for the bot. Then, copy the link and use it to invite the bot to your servers!

# Avaliable Commands?
Note: ```[@User]``` Represents a Discord's user tag predicated by @

```
# Flames a user, truly a savage maneuver ("Consider yourself officially flamed: [@User]")
!flame [@User]
```

```
#Plays an audio file that counts down from 3
!suplex [@User]
```
