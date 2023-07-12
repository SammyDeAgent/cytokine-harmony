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
const ytSearch = require('youtube-sr').default;
const axios = require('axios');

// const Client = require('../bot.js');

// Importing Queue Class
const Queue = require('../class/queueClass.js');

// Variable
var player = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription(
      "Search up to 10 songs from YT search"
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
      await interaction.editReply("```You need to be in a Channel to execute this command.```");
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

        // player.on('error', async (error) => {
        //   console.log('Warning! Something went wrong.');
        //   console.log(player.playlist);
        //   console.log(error);
        // });
        
      } else {
        player = connection._state.subscription.player;
      }

      // Check for "CONNECT" and "SPEAK" permissions

      // Retrieving the string behind /search
      const query = await interaction.options.getString("query");

      // Check the query if matches a url
      const searchList =
        /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(query) ?
        await searchFinder(encodeURI(query)) :
        await searchFinder(query);

      await interaction.editReply({
        embeds: [await generateSearchEmbed(searchList, sender)]
      });
    }
  }
};

async function generateSearchEmbed(list, sender) {

  let listMsg = ``;
  for(i in list) {
    listMsg += `${parseInt(i)+1} - [${list[i].title}](${list[i].url}) \n`;
  }

  let embed = new MessageEmbed()
    .setColor(0x00ffff)
    .setTitle(`Search List`)
    .addField(
      'Found Results',
      listMsg,
      false
    ).setTimestamp()
    .setFooter(
      `Seached by ${sender.username}#${sender.discriminator}`,
      `https://cdn.discordapp.com/avatars/${sender.id}/${sender.avatar}`
    );

  return embed;
}

async function searchFinder(query) {
  try {
    let videoResult = await ytSearch.search(query, {limit: 10});
    return videoResult.map((item) => (
      {
        title: item.title,
        url: item.url
      }
    ));
  } catch (err) {
    return null;
  }
}

async function videoFinder(query) {
  try {
    let videoResult = await ytSearch.searchOne(query);
    let res = await ytSearch.getVideo(videoResult.url);
    videoResult.description = res.description.substring(0, trimlength = 127) + "..." ?? "N/A";
    return videoResult;
  } catch (err) {
    return null;
  }
}

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
      video.channel.name,
      ytc_url ?? 'https://yt3.ggpht.com/584JjRp5QMuKbyduM_2k5RlXFqHJtQ0qLIPZpwbUjMJmgzZngHcam5JMuZQxyzGMV5ljwJRl0Q=s176-c-k-c0x00ffffff-no-rj',
      video.channel.url
    )
    .setDescription(video.description ?? 'N/A')
    .setThumbnail(video.thumbnail.url)
    .addField(
      'Views',
      video.views.toLocaleString("en-US") || 'N/A',
      true
    )
    .addField(
      'Length',
      video.durationFormatted,
      true
    )
    .addField(
      'Uploaded',
      video.uploadedAt || 'N/A',
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