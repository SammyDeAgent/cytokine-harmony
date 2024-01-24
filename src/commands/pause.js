const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  generateDependencyReport
} = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription(
      "Pause the current audio player"
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

        if (player._state.status == 'playing') {
          player.pause();
          await interaction.reply("```Paused Harmony's audio player.```");
        } else {
          await interaction.reply("```Harmony's audio player is currently not in PLAYING state.```");
        }
      }
    }
  }
};
