// Module Imports
const {
  MessageEmbed,
} = require('discord.js')
const {
  getVoiceConnection,
  createAudioResource,
} = require('@discordjs/voice')

const playdl = require('play-dl');
const ytSearch = require('youtube-sr').default;
const axios = require('axios');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isSelectMenu()) return;
    if (!(interaction.message.interaction.commandName === 'search')) return;

    const sender = interaction.member.user;
    const msgChannel = await interaction.channelId;

    // Get the connection status of the channel
    var connection = getVoiceConnection(interaction.guildId);
    player = connection._state.subscription.player;

    let url = interaction.values[0];

    const video = await videoFinder(url);

    await interaction.update({
      content: "```Search Timed Out```",
      embeds: [],
      components: []
    })

    if(video) {
      let stream = await playdl.stream(url);

      if (player.state.status == 'playing' || player.state.status == 'paused') {
         player.playlist.addSong({
           stream,
           video,
           sender,
           msgChannel
         });

         await interaction.guild.channels.cache.get(msgChannel).send({
           content: `Added **${video.title}** to playlist.`
         })
      }else{
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

        await interaction.guild.channels.cache.get(msgChannel).send({
          embeds: [embed]
        });
      }

       
    }else{
      await interaction.guild.channels.cache.get(msgChannel).send({
        content: `Critical Error!`
      })
    }
    
  }
}

async function videoFinder(query) {
  try {
    let res = await ytSearch.getVideo(query);
    res.description = res.description.substring(0, trimlength = 127) + "..." ?? "N/A";
    return res;
  } catch (err) {
    return null;
  }
}

async function generateEmbed(channel_key, video, sender) {

  // Obtaining channel picture from old and new youtube profile url
  // Unless someone figure out something else, DONT REMOVE THIS

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
    .setAuthor({
      name: video.channel.name,
      url: video.channel.url,
      iconURL: ytc_url ?? 'https://yt3.ggpht.com/584JjRp5QMuKbyduM_2k5RlXFqHJtQ0qLIPZpwbUjMJmgzZngHcam5JMuZQxyzGMV5ljwJRl0Q=s176-c-k-c0x00ffffff-no-rj',
    })
    .setDescription(video.description ?? 'N/A')
    .setThumbnail(video.thumbnail.url)
    .addFields(
      [{
          name: 'Views',
          value: video.views.toLocaleString("en-US") || 'N/A',
          inline: true
        },
        {
          name: 'Length',
          value: video.durationFormatted,
          inline: true
        },
        {
          name: 'Uploaded',
          value: video.uploadedAt || 'N/A',
          inline: true
        }
      ]
    )
    .setTimestamp()
    .setFooter({
      text: `Requested by ${sender.username}`,
      iconURL: `https://cdn.discordapp.com/avatars/${sender.id}/${sender.avatar}`
    });

  return embed;
}

function playerPlay(stream, player) {
  let resource = createAudioResource(stream.stream, {
    inlineVolume: true,
    inputType: stream.type,
  });

  resource.volume.setVolume(0.2);

  player.play(resource);
}
