const Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var opus = require('opusscript');
const googleSpeech  = require('@google-cloud/speech');
require('dotenv').config()

const googleSpeechClient = new googleSpeech .SpeechClient();

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
        const receiver = connection.createReceiver()

        connection.on('speaking', (userID, speaking) => {
            if (!speaking) {
                logger.info(userID + " not speaking")
                return
            }
        
            logger.info(`I'm listening to ${userID}`)
        
            // this creates a 16-bit signed PCM, stereo 48KHz stream
            const audioStream = receiver.createPCMStream(userID);

            const request = {
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 48000,
                    languageCode: 'en-US'
                },
                interimResults: false
            }

            const recognizeStream = googleSpeechClient
                .streamingRecognize(request)
                .on('error', console.error)
                .on('data', response => {
                    const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n')
                    .toLowerCase()
                    logger.info(`Transcription: ${transcription}`)
            })

            recorder.record({
                sampleRateHertz: 48000,
                threshold: 0,
                verbose: false,
                recordProgram: 'rec',
                silence: '10.0',
            })
            .stream()
            .on('error', console.error)
            .pipe(recognizeStream)
        
            // const convertTo1ChannelStream = new ConvertTo1ChannelStream()
        
            // audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream)
        
            // audioStream.on('end', async () => {
            //     logger.info('audioStream end')
            // })
        })
    })
}


