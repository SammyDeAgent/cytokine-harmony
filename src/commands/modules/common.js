// Module Imports
const {
  MessageEmbed,
} = require('discord.js')
const {
  createAudioResource,
} = require('@discordjs/voice');
const ytSearch = require('youtube-sr').default;
const axios = require('axios');

module.exports = {

  generateSearchEmbed: async function(list){
    let listMsg = ``;
    for (i in list) {
      listMsg += `${parseInt(i)+1} - [${list[i].title}](${list[i].url}) \n`;
    }

    let embed = new MessageEmbed()
      .setColor(0x00ffff)
      .setTitle(`Search List`)
      .setDescription("> Select a track to insert via Drop Menu")

    for (item of list) {
      let embedName = `${item.id} - ${item.title}`;
      let embedValue = `[${item.channelName}](${item.channelURL}) [[${item.duration}](${item.url})]`;

      embed.addFields({
        name: embedName,
        value: embedValue
      })
    }

    return embed;
  },

  generateEmbed: async function(channel_key, video, sender) {

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
        iconURL: ytc_url??'https://yt3.ggpht.com/584JjRp5QMuKbyduM_2k5RlXFqHJtQ0qLIPZpwbUjMJmgzZngHcam5JMuZQxyzGMV5ljwJRl0Q=s176-c-k-c0x00ffffff-no-rj',
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
  },

  generateListEmbed: async function(playlist) {
    const embed = new MessageEmbed()
      .setColor(0x050100)
      .setTitle("Current Playlist")
      .setDescription("> Playlist can be expanded via **PLAY**, skipped via **SKIP**, remove particular listing via **REMOVE** or cleared completely via **CLEAR**.")

    for (track of playlist) {

      let embedName = "";

      if (track.id == 1) {
        embedName = `${track.id} - ${track.title}` + " `PLAYING`";
      } else {
        embedName = `${track.id} - ${track.title}`;
      }

      let embedValue = `[${track.channelName}](${track.channelURL}) [[${track.duration}](${track.videoURL})] - Requested By **${track.senderName}**`;

      embed.addFields({
        name: embedName,
        value: embedValue
      })
    }

    return embed;
  },
  
  // Used when query word is provided instead of url
  // Returns object with url and other stuff
  videoFinder: async function(query) {
    try {
      let videoResult = await ytSearch.searchOne(query);
      let res = await ytSearch.getVideo(videoResult.url);
      videoResult.description = res.description.substring(0, trimlength = 127) + "..." ?? "N/A";
      return videoResult;
    } catch (err) {
      return null;
    }
  },

  searchFinder: async function(query){
    try {
      let videoResult = await ytSearch.search(query, {
        limit: 10
      });

      let searchID = 1;

      return videoResult.map((item) => ({
        id: searchID++,
        title: item.title,
        url: item.url,
        duration: item.durationFormatted,
        channelName: item.channel.name,
        channelURL: item.channel.url
      }));
    } catch (err) {
      return null;
    }
  },

  playerPlay: function(stream, player) {
    let resource = createAudioResource(stream.stream, {
      inlineVolume: true,
      inputType: stream.type,
    });

    resource.volume.setVolume(0.2);

    player.play(resource);
  }

}