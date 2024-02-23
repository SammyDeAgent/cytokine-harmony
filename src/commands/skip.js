const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  getVoiceConnection,
} = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription(
      "Skip the audio player's current audio stream"
    ),
  async execute(interaction) {

    const voiceChannel = interaction.guild.members.cache.get(interaction.member.user.id).voice.channel;
    if (!voiceChannel) {
      await interaction.reply("```You need to be in a Channel to execute this command.```");
    } else {

      // Get the connection status of the channel
      const connection = getVoiceConnection(interaction.guildId);

      if(!connection) {
        await interaction.reply("```Harmony is currently not in any channel.```");
      }else {
        const player = connection._state.subscription.player;
        player.stop();

        await interaction.reply("```Skipped the current audio stream.```");
      }
    }
  }
};
