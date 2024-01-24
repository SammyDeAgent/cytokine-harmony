// Module Imports
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
const playdl = require('play-dl');
const ytSearch = require('youtube-sr').default;
const axios = require('axios');

const {
  generateEmbed,
  videoFinder,
  playerPlay
} = require('./modules/common.js');

// Importing Queue Class
const Queue = require('../class/queueClass.js');

// Variable
var player = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      "Join a channel and plays from YT search result"
    ).addStringOption(option =>
      option.setName('query')
      .setDescription('Search term YT')
      .setRequired(true)
    ),
  async execute(interaction) {

    await interaction.deferReply();

    const sender = interaction.member.user;
    const msgChannel = await interaction.channelId;
    const voiceChannel = await interaction.guild.members.cache.get(sender.id).voice.channel;

    if (!voiceChannel) {
      await interaction.editReply({
        content: "```You need to be in a Channel to execute this command.```"
      });
    } else {

      // Get the connection status of the channel
      var connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // 06/03/2022 - API Fix
        connection.on('stateChange', (oldState, newState) => {
          const oldNetworking = Reflect.get(oldState, 'networking');
          const newNetworking = Reflect.get(newState, 'networking');

          const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
          }

          oldNetworking?.off('stateChange', networkStateChangeHandler);
          newNetworking?.on('stateChange', networkStateChangeHandler);
        });
        
        player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Idle
          }
        });

        player.playlist = new Queue();

        connection.subscribe(player);

        // Idling event handler
        player.on(AudioPlayerStatus.Idle, async () => {

          player.playlist.rmFinSong();

          if (!player.playlist.isEmpty()) {
            let curStream = player.playlist.getNextSong();

            playerPlay(curStream.stream, player);

            // Reply Embed + API call for YT Channel Picture
            let channel_key = (curStream.video.channel.url).split("/")[(curStream.video.channel.url).split("/").length - 1];
            let embed = await generateEmbed(channel_key, curStream.video, curStream.sender);

            await interaction.guild.channels.cache.get(msgChannel).send({
              embeds: [embed]
            })
          }
        });

      }else {
        player = connection._state.subscription.player;
      }

      // Check for "CONNECT" and "SPEAK" permissions

      // Retrieving the string behind /play
      const query = await interaction.options.getString("query");

      // Check the query if matches a url
      const video =
        /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(query) ?
        await videoFinder(encodeURI(query)) :
        await videoFinder(query);

      if (video) {

        // Checking if player is currently playing a song
        // Queue up the song if the player is currently playing or paused
        // Play next song on idle

        // Make a stream obj from url
        let stream = await playdl.stream(video.url);

        if (player.state.status == 'playing' || player.state.status == 'paused') {

          player.playlist.addSong({
            stream, 
            video,
            sender,
            msgChannel
          });

          await interaction.editReply(`Added **${video.title}** to playlist.`);

        } else {

          player.playlist.addSong({
            stream,
            video,
            sender,
            msgChannel
          });

          // Play the very first incoming music req.
          playerPlay(stream, player);
          
          // Reply Embed + API call for YT Channel Picture
          let channel_key = (video.channel.url).split("/")[(video.channel.url).split("/").length - 1];
          let embed = await generateEmbed(channel_key, video, sender);

          await interaction.editReply({
            embeds: [embed]
          });

        }

      } else {
        await interaction.editReply("```Could not find any search results.```");
      }
    }
  },
};