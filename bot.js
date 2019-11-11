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

        if(args[0] == "flame") {
            if(args.length != 2) {
                msg.reply("Please specify only the command, and target of the flame (without spaces in the flames name).");
                logger.info("User " + msg.author.username + " gave an improper number of parameters");
                return;
            } 
            
            if(args[1].length > 30) {
                msg.reply("Please limit your flame target to 30 characters");
                logger.info("User " + msg.author.username + " provided a flame target of >30 characters");
                return;
            } 
            
            logger.info("User " + msg.author.username + " requested a flame on: " +  args[1]);
            flame(msg, args[1]);
        }
    }
});

async function flame(msg, target) {
    lock.acquire(msg, async function(done) {
        var text;
        var response;
        var voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel){
            msg.reply("Please join a Voice Channel before issuing the !flame command!"); 
            logger.info("User " + msg.author.username + " requested bot without being in a VC")
            done();
            return;
        }
    
        if(voiceChannel.full == true) {
            msg.reply("Your Voice Channel is full");
            logger.info("Bot attempted to join full VC")
            done();
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
        try {
            [response] = await client.synthesizeSpeech(request);
        } catch(err) {
            msg.reply("Google isn't happy with this many request being made, wait up a bit.");
            logger.error(err)
            done();
            return;
        }
    
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('flame.mp3', response.audioContent, 'binary');
        logger.info('Audio content written to file: flame.mp3');
    
        try {
            voiceChannel.join().then(connection => {
                const stream = fs.createReadStream('./flame.mp3');
                dispatcher = connection.playStream(stream);
                dispatcher.on('end', () => {
                    //Disconnect from voice channel and delete our file
                    voiceChannel.leave();
                    logger.info("Disconnected from Voice Channel");
                    try {
                        fs.unlinkSync("./flame.mp3");
                    } catch (err) {
                        logger.error(err);
                    }
                    done();
                });
            });
        } catch(err) {
            logger.error(err);
        }
    })
    return;
}


