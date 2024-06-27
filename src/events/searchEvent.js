// Module Imports
const {
  getVoiceConnection,
} = require('@discordjs/voice')

const {
  generateEmbed,
  videoFinder,
  playerPlay
} = require('../commands/modules/common.js');

const playdl = require('play-dl');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {

    if (interaction.customId == "search_cancel") {
      await interaction.update({
        content: "```Search Cancelled```",
        embeds: [],
        components: []
      })
      return;
    }

    if (!interaction.isSelectMenu()) return;
    if (!(interaction.message.interaction.commandName === 'search')) return;

    let url = interaction.values[0];

    const sender = interaction.member.user;
    const msgChannel = await interaction.channelId;

    // Get the connection status of the channel
    var connection = getVoiceConnection(interaction.guildId);
    player = connection._state.subscription.player;

    const video = await videoFinder(url);

    await interaction.update({
      content: "```Search Confirmed```",
      embeds: [],
      components: []
    })

    if(video) {
      let stream = await playdl.stream(url, {
        quality: 2,
        precache: 3,
        discordPlayerCompatibility: true
      });

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