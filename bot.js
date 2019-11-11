const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const axios = require('axios');

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
            case 'behavior':
                    behavior(msg);
            break;
        }
    }
});

async function behavior(msg) {
   msg.reply("WIP")
}


