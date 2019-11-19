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

/**
 * Handles whenever a message is sent into the discord server, irrespective of channels
 */
bot.on('message', msg => {
    var command = "";
    var params = "";
    const content = msg.content;

    if(content.startsWith("!")) {
        var args = content.substr(1); // Strip away !

        //If there's a given parameter
        if(args.indexOf(' ') != -1) {
            command = args.substr(0, args.indexOf(' ')); // Break off param
            params = args.substr(args.indexOf(' ') + 1); //Break off command
        } else {
            command = args;
        }

        //Switch through to determine how we handle the command
        switch(command){
            case "flame":
                if(params.length <= 0) {
                    msg.reply("Please specify a target for your flame!");
                    logger.info("User " + msg.author.username + " requested a flame without a target");
                    return;
                }
                
                if(params.length > 30) {
                    msg.reply("Please limit your flame target to 30 characters");
                    logger.info("User " + msg.author.username + " provided a flame target of >30 characters");
                    return;
                } 
                
                logger.info("User " + msg.author.username + " requested a flame on: " +  params);
                flame(msg, params);
                break;
            case "suplex":
                if(params.length > 0) {
                    msg.reply("Please specify only the command, no extra parameters");
                    logger.info("User " + msg.author.username + " gave an improper number of parameters");
                    return;
                }
    
                logger.info("User " + msg.author.username + " requested a suplex");
                suplex(msg);
                break;
        }
    }
});

/**
 * Plays the suplex.mp4 as audio in the user's VC
 * 
 * @param {*} msg Message object carried down from our caller
 */
async function suplex(msg) {
    lock.acquire(msg, async function(done) {
        var voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel){
            msg.reply("Please join a Voice Channel before issuing the !suplex command!"); 
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

        try {
            voiceChannel.join().then(connection => {
                dispatcher = connection.playFile('./resources/suplex.mp4');
                dispatcher.on('end', () => {
                    //Disconnect from voice channel
                    voiceChannel.leave();
                    logger.info("Disconnected from Voice Channel");
                    done();
                });
            });
        } catch(err) {
            logger.error(err);
        }
    })
    return;
}

/**
 * Interfaces with Google text-to-speech to translate our text string coupled 
 * with given users name to output in the user's VC
 * 
 * @param {*} msg The message object carried down from our caller
 * @param {*} target The target user to flame
 */
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
    
        //Builds our string to convert to speech
        if(target == "me" || target == "myself") {
            text = "Consider yourself officially flamed, " + msg.author.username;
        } else {
            text = "Consider yourself officially flamed, " + target;
        }
    
        const client = new textToSpeech.TextToSpeechClient();
    
        // Construct the request
        const request = {
            input: {text: text},
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            audioConfig: {audioEncoding: 'MP3'},
        };
    
        // Performs the Text-to-Speech request
        try {
            [response] = await client.synthesizeSpeech(request);
        } catch(err) {
            msg.reply("Unable to interface with google's text-to-speech API right now, sorry!.");
            logger.error(err)
            done();
            return;
        }
    
        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('./resources/flame.mp3', response.audioContent, 'binary');
        logger.info('Audio content written to file: flame.mp3');
    
        try {
            voiceChannel.join().then(connection => {
                const stream = fs.createReadStream('./resources/flame.mp3');
                dispatcher = connection.playStream(stream);
                dispatcher.on('end', () => {
                    //Disconnect from voice channel and delete our file
                    voiceChannel.leave();
                    logger.info("Disconnected from Voice Channel");
                    try {
                        fs.unlinkSync("./resources/flame.mp3");
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


