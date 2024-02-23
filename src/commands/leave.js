const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  getVoiceConnection,
} = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription(
      "Leave the voice channel and terminate connection"
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
        connection.destroy();
        await interaction.reply("```Connection Terminated.```");
      }

    }
  }
};
