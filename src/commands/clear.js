const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  getVoiceConnection,
} = require('@discordjs/voice');
const Queue = require('../class/queueClass');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription(
      "Clear the entire playlist and remake anew"
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
        player.playlist = new Queue();
        player.stop();

        await interaction.reply("```Destroyed and remade Harmony's playlist.```");
      }
    }
  }
};