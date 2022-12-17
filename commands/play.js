const {
  MessageEmbed,
} = require('discord.js')
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  generateDependencyReport
} = require('@discordjs/voice');
// const ytdl = require('ytdl-core');
const ytdl = require('play-dl');
const ytSearch = require('yt-search');
const axios = require('axios');

// Importing Queue Class
const Queue = require('../queue/queueClass.js');
const musicQueue = new Queue();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      "Join a channel and plays external source media"
    ).addStringOption(option =>
      option.setName('query')
        .setDescription('Search term YT')
        .setRequired(true)
    ),
  async execute(interaction) {

    await interaction.deferReply();

    const sender = interaction.member.user;

    const voiceChannel = await interaction.guild.members.cache.get(sender.id).voice.channel;

    if (!voiceChannel) {
      await interaction.editReply("```You need to be in a Channel to execute this command.```");
    } else {

      // Joins the user's channel
      var connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
      }

      // Check for "CONNECT" and "SPEAK" permissions

      // Used when query word is provided instead of url
      // Returns object with url and other stuff
      const videoFinder = async (query) => {
        const videoResult = await ytSearch(query);
        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
      }

      // Retrieving the string behind /play
      const query = await interaction.options.getString("query");

      // Check the query if matches a url
      const video = 
        /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(query) ? 
          await videoFinder(encodeURI(query)):
          await videoFinder(query);

      // Create player object
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      if (video) {

        // Make a stream obj from url
        let stream = await ytdl.stream(video.url);

        // Add stream object to queue
        musicQueue.addSong(stream);

        // Listener to check for song fin
        player.on(AudioPlayerStatus.Idle, () => {
          musicQueue.rmFinSong();

          if (!musicQueue.isEmpty()) {
            let curStream = musicQueue.getNextSong();
            playerPlay(curStream, player);
          } else {
            console.log("No more songs in queue");
          }

        });

        connection.subscribe(player);

        // Play the very first incoming music req.
        playerPlay(stream, player);

        // Reply Embed + API call for YT Channel Picture
        const ytc_data_id = async (keyword, api_key = process.env.G_KEY) => {
          return await axios.get(
            'https://www.googleapis.com/youtube/v3/channels',
            {
              params: {
                  part: 'snippet',
                  id: keyword ?? ' ',
                  key: api_key,
              },
              headers: {
                'content-type': 'application/json,charset=UTF-8',
                'accept-encoding': '*',
              },
              responseType: 'json',
              responseEncoding: 'utf8',
            }
          ).then(function(res){
            try{
               return res.data.items[0].snippet.thumbnails.default.url ?? undefined;
            }catch(error){
               return undefined;
            }          
          });
        }

        const ytc_data_name = async (keyword, api_key = process.env.G_KEY) => {
          return await axios.get(
            'https://www.googleapis.com/youtube/v3/channels', 
            {
              params: {
                part: 'id',
                forUsername: keyword,
                key: api_key,
              },
              headers: {
                'content-type': 'application/json,charset=UTF-8',
                'accept-encoding': '*',
              },
              responseType: 'json',
              responseEncoding: 'utf8',
            }
          ).then(function (res) {
            try{
              return res.data.items[0].id;
            }catch(error) {
              return undefined;
            }
          });
        }

        // await interaction.reply(`Playing - ${video.url}`);
        await interaction.editReply({
          embeds: [embed]
        });

      } else {
        await interaction.editReply("```Could not find any search results.```");
      }
    }
  },
};

function playerPlay(stream, player) {
  let resource = createAudioResource(stream.stream, {
    inlineVolume: true,
    inputType: stream.type,
  });

  resource.volume.setVolume(0.1);

  player.play(resource);
}
