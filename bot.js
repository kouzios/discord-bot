const Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
const googleSpeech = require('@google-cloud/speech')

const googleSpeechClient = new googleSpeech.SpeechClient()

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
                msg.reply("Pong!");
            break;
            case 'police':
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
    
    //TODO: On disconnect, disconnect bot
    voiceChannel.join().then(connection => {
        // events.on('speaking', (userID, SSRC, speaking) => {
        //     if (!speaking) {
        //       return
        //     }
        
        //     console.log(`I'm listening to ${user.username}`)
        
        //     // this creates a 16-bit signed PCM, stereo 48KHz stream
        //     const audioStream = bot.getAudioContext(voiceChannel);
        //     const requestConfig = {
        //       encoding: 'LINEAR16',
        //       sampleRateHertz: 48000,
        //       languageCode: 'en-US'
        //     }
        //     const request = {
        //       config: requestConfig
        //     }
        //     const recognizeStream = googleSpeechClient
        //       .streamingRecognize(request)
        //       .on('error', console.error)
        //       .on('data', response => {
        //         const transcription = response.results
        //           .map(result => result.alternatives[0].transcript)
        //           .join('\n')
        //           .toLowerCase()
        //         console.log(`Transcription: ${transcription}`)
        //       })
        
        //     const convertTo1ChannelStream = new ConvertTo1ChannelStream()
        
        //     audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream)
        
        //     audioStream.on('end', async () => {
        //       console.log('audioStream end')
        //     })
        //   })
    })
}


