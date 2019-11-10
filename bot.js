const Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
require('dotenv').config()

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const bot = new Discord.Client();
bot.login(auth.token);

//https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/
bot.on('ready', () => {
    logger.info('Connected');
});

bot.on('message', msg => {
    var content = msg.content;
    if(content.startsWith("!")) {
        var args = content.substr(1); //Strip away "!"
        switch(args) {
            case 'ping':
                logger.info("Request for ping pong");
                msg.reply("Pong!");
            break;
            case 'police':
                logger.info("Request for police");
                police(msg);
            break;
        }
    }
});

async function police(msg) {
    var voiceChannel = msg.member.voiceChannel;
    if(!voiceChannel){
        msg.reply("Please join a Voice Channel before issuing the !police command!"); 
        return
    }

    //TODO: On summoner user disconnect, disconnect bot
    //TODO: Check what happens if in muted channel

    voiceChannel.join().then(connection => {

        connection.on('speaking', (userID, speaking) => {
            if (!speaking) {
                logger.info(userID + " not speaking")
                return
            }
        
            logger.info(`I'm listening to ${userID}`)
        });
    })
}


