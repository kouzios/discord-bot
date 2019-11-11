const Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');
var AsyncLock = require('async-lock');

var lock = new AsyncLock();

require('dotenv').config()

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', () => {
    logger.info('Connected');
});

bot.on('message', msg => {
    var content = msg.content;
    if(content.startsWith("!")) {
        var args = content.substr(1).split(" "); //Strip away "!", break into command and param
        if(args.length != 2) {
            msg.reply("Please specify only the command, and the target of the flame");
            return;
        }

        if(args[0] == "flame") {
            logger.info("Request for flame on: " +  args[1]);
            flame(msg, args[1]);
        }
    }
});

async function flame(msg, target) {
    lock.acquire(msg, async function(done) {
        var text;
        var voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel){
            msg.reply("Please join a Voice Channel before issuing the !police command!"); 
            return
        }
    
        if(voiceChannel.full == true) {
            msg.reply("Your Voice Channel is full");
            return;
        }
    
        if(target == "me" || target == "myself") {
            text = "Consider yourself officially flamed, " + msg.author.username;
        } else {
            text = "Consider yourself officially flamed, " + target;
        }
    
        const client = new textToSpeech.TextToSpeechClient();
    
        // Construct the request
        const request = {
            input: {text: text},
            // Select the language and SSML Voice Gender (optional)
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            // Select the type of audio encoding
            audioConfig: {audioEncoding: 'MP3'},
        };
    
        // Performs the Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);
    
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('flame.mp3', response.audioContent, 'binary');
        logger.info('Audio content written to file: flame.mp3');
    
        voiceChannel.join().then(connection => {
            const dispatcher = connection.playFile('./flame.mp3');
            dispatcher.on('end', () => {
                //Disconnect from voice channel and delete our file
                voiceChannel.leave();
                fs.unlinkSync("./flame.mp3");
                logger.info("Disconnected from Voice Channel");
                done();
            });
        });
    })
}


