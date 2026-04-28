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
    .setName('remove')
    .setDescription(
      "Remove a track from the queue list"
    ).addNumberOption( option =>
      option.setName('position')
      .setDescription('Queue Position')
      .setRequired(true)
    )
    ,
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

        // Retrieving the string behind /search
        let pos = await interaction.options.getNumber("position");
        
        if (pos <= 0 || pos > player.playlist.size()) {
          await interaction.reply({
            content: '```Invalid Queue Position.```',
            // embeds: [embed]
          });

        }else {
          (async () => {
            if (pos == 1) {
              player.stop();
              await interaction.reply({
                content: '```Skipped the current audio stream.```',
                // embeds: [await generateListEmbed(player.playlist.list())]
              });

            } else {
              let removed = await player.playlist.removeSong(pos - 1)[0];
              await interaction.reply({
                content: `Removed **${removed.video.title}** from the playlist.`,
                // embeds: [await generateListEmbed(player.playlist.list())]
              });
            }
          })();
        }
      }
    }
  },
}