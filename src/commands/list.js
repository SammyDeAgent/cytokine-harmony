const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  getVoiceConnection,
} = require('@discordjs/voice');

const {
  generateListEmbed
} = require('./modules/common.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription(
      "Show the current added songs in the playlist"
    ),
  async execute(interaction) {

    const voiceChannel = interaction.guild.members.cache.get(interaction.member.user.id).voice.channel;
    if (!voiceChannel) {
      await interaction.reply("```You need to be in a Channel to execute this command.```");
    } else {

      // Get the connection status of the channel
      const connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        await interaction.reply("```Harmony is currently not in any channel.```");
      } else {
        const player = connection._state.subscription.player;

        if(player.playlist.size() === 0) {
          await interaction.reply("```Current playlist is empty.```");
        } else {

          let playlist = player.playlist.list();

          let embed = await generateListEmbed(playlist);

          await interaction.reply({
            embeds: [embed]
          });
        }

      }
    }
  }
};