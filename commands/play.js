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
const ytdl = require('play-dl');
const ytSearch = require('yt-search');
const axios = require('axios');

// const Client = require('../bot.js');

// Importing Queue Class
const Queue = require('../class/queueClass.js');
const playlist = new Queue();

// Variable
let player = null;

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
        

        player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Idle
          }
        });

        // Idling event handler
        player.on(AudioPlayerStatus.Idle, async () => {

          playlist.rmFinSong();

          if (!playlist.isEmpty()) {
            let curStream = playlist.getNextSong();

            playerPlay(curStream.stream, player);

            // Reply Embed + API call for YT Channel Picture
            let channel_key = (curStream.video.author.url).split("/")[(curStream.video.author.url).split("/").length - 1];
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
        await videoFinder(encodeURI(query)) :
        await videoFinder(query);

      if (video) {

        // Checking if player is currently playing a song
        // Queue up the song if the player is currently playing
        // Play next song on idle

        // Make a stream obj from url
        let stream = await ytdl.stream(video.url);

        let status = player.state.status;

        console.log(status);

        if(status == 'playing') {

          playlist.addSong({
            stream, 
            video,
            sender,
            msgChannel
          });

          await interaction.editReply(`Added **${video.title}** to playlist.`);

        } else {

          playlist.addSong({
            stream,
            video,
            sender,
            msgChannel
          });
          
          connection.subscribe(player);

          // Play the very first incoming music req.
          playerPlay(stream, player);

          // Reply Embed + API call for YT Channel Picture
          let channel_key = (video.author.url).split("/")[(video.author.url).split("/").length - 1];
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

async function generateEmbed(channel_key, video, sender) {

  const ytc_data_id = async (keyword, api_key = process.env.G_KEY) => {
    return await axios.get(
      'https://www.googleapis.com/youtube/v3/channels', {
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
    ).then(function (res) {
      try {
        return res.data.items[0].snippet.thumbnails.default.url ?? undefined;
      } catch (error) {
        return undefined;
      }
    });
  }

  const ytc_data_name = async (keyword, api_key = process.env.G_KEY) => {
    return await axios.get(
      'https://www.googleapis.com/youtube/v3/channels', {
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
      try {
        return res.data.items[0].id;
      } catch (error) {
        return undefined;
      }
    });
  }

  const channel_id = 
    (/^[@].*$/.test(channel_key)) ? 
      await ytc_data_name(channel_key.substring(1)) : 
      channel_key;

  const ytc_url = await ytc_data_id(await channel_id);

  const embed = new MessageEmbed()
    .setColor(0xffff00)
    .setTitle(video.title)
    .setURL(video.url)
    .setAuthor(
      video.author.name,
      ytc_url ?? 'https://yt3.ggpht.com/584JjRp5QMuKbyduM_2k5RlXFqHJtQ0qLIPZpwbUjMJmgzZngHcam5JMuZQxyzGMV5ljwJRl0Q=s176-c-k-c0x00ffffff-no-rj',
      video.author.url
    )
    .setDescription(video.description)
    .setThumbnail(video.thumbnail)
    .addField(
      'Views',
      video.views.toLocaleString("en-US") || 'N/A',
      true
    )
    .addField(
      'Length',
      video.timestamp,
      true
    )
    .addField(
      'Uploaded',
      video.ago || 'N/A',
      true
    )
    .setTimestamp()
    .setFooter(
      `Requested by ${sender.username}#${sender.discriminator}`,
      `https://cdn.discordapp.com/avatars/${sender.id}/${sender.avatar}`
    );

  return embed;
}

function playerPlay(stream, player) {
  let resource = createAudioResource(stream.stream, {
    inlineVolume: true,
    inputType: stream.type,
  });

  resource.volume.setVolume(0.1);

  player.play(resource);
}