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
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = "debug";

const bot = new Discord.Client({ disableEveryone: true });
bot.login(auth.token);

const maxChars = 150;

bot.on("ready", () => {
  logger.info("Connected");
});

/**
 * Handles whenever a message is sent into the discord server, irrespective of channels
 */
bot.on("message", (msg) => {
  var command = "";
  var params = "";
  const content = msg.content;

  if (content.startsWith("!")) {
    var args = content.substr(1); // Strip away !
    console.log(args);

    //If there's a given parameter
    if (args.indexOf(" ") != -1) {
      command = args.substr(0, args.indexOf(" ")); // Break off param
      params = args.substr(args.indexOf(" ") + 1); //Break off command
      params = params.split(" ");
    } else {
      command = args;
    }

    /* Change this block to individual if later commands need different parameter styles */
    if (params.length != 1) {
      msg.reply(
        "Please specify the !command, and the @User required to target your command [Ex: !flame @Kouz]"
      );
      logger.info(
        "User " +
          msg.author.username +
          " gave an improper number of parameters"
      );
      return;
    }
    logger.info("User " + msg.author.username + " requested a test");
    let target = params[0];
    target = target.match(/[0-9]/g);
    if(!target) {
      msg.reply(
        "Please specify a valid user by using the Discord '@' symbol then clicking on the desired user"
      );
      return;
    }
    target = target.join(""); //Keep only numbers
    /* End param block */

    switch (command) {
      case "suplex":
        suplex(msg, target);
        break;
      case "flame":
        flame(msg, target);
        break;
    }
  }
});

/**
 * Plays the suplex.mp4 as audio in the user's VC
 *
 * @param {*} msg Message object carried down from our caller
 */
const suplex = async (msg, target) => {
  lock.acquire(msg, async function (done) {
    const member = getMember(msg, target);
    if(member === null) {
      done()
      return;
    }

    var voiceChannel = getVoiceChannel(msg, member);
    if(voiceChannel === null) {
      done()
      return;
    }
    
    try {
      voiceChannel.join().then((connection) => {
        dispatcher = connection.playFile("./resources/suplex.mp4");
        dispatcher.on("end", () => {
          //Disconnect from voice channel
          voiceChannel.leave();
          done();
        });
      });
    } catch (err) {
      msg.reply(
        "An unexpected error occured while attempting to join the voice channel!"
      );
      console.log(err);
      logger.error(err);
      done();
      return;
    }
  });
  return;
};

/**
 * Interfaces with Google text-to-speech to translate our text string coupled
 * with given users name to output in the user's VC
 *
 * @param {*} msg The message object carried down from our caller
 * @param {*} target The target user to flame
 */
const flame = async(msg, target) => {
  lock.acquire(msg, async function (done) {
    const member = getMember(msg, target);
    if(member === null) {
      done()
      return;
    }

    var voiceChannel = getVoiceChannel(msg, member);
    if(voiceChannel === null) {
      done()
      return;
    }

    const client = new textToSpeech.TextToSpeechClient();
    // Construct the request
    const request = {
      input: { text: "Consider yourself officially flamed " + member.user.username },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the Text-to-Speech request
    try {
      [response] = await client.synthesizeSpeech(request);
    } catch (err) {
      console.log(err);
      msg.reply(
        "Unable to interface with google's text-to-speech API right now, sorry!"
      );
      logger.error(err);
      done();
      return;
    }

    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile("./resources/flame.mp3", response.audioContent, "binary");
    logger.info("Audio content written to file: flame.mp3");

    try {
      voiceChannel.join().then((connection) => {
        const stream = fs.createReadStream("./resources/flame.mp3");
        dispatcher = connection.playStream(stream);
        dispatcher.on("end", () => {
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
    } catch (err) {
      logger.error(err);
    }
  });
  return;
}

const getMember = (msg, target) => {
  //Get all members, then filted to specified target
  let members = [...msg.guild.members];
  members.filter((member) => {
    return member.id === target; //If the specified user matches a user in any channel
  });

  if (members.length === 0) {
    msg.reply("There are no members of that tag in the discord!");
    return null;
  }
  return members[0][1]; //Simplify our array to get rid of parent array (only 1 element), and id (position 0 in sub-array)
}

const getVoiceChannel = (msg, member) => {
  let channels = new Map([...msg.guild.channels]);

  //Get voice channel from our member's existing voice channel location
  const voiceChannelID = member.voiceChannelID;
  if (!voiceChannelID) {
    msg.reply(
      "Unable to complete request, member is not in a discord voice channel."
    );
    return null;
  }

  const voiceChannel = channels.get(voiceChannelID);
  if (voiceChannel.full == true) {
    msg.reply("Your Voice Channel is full");
    return null;
  }
  
  return voiceChannel;
}
