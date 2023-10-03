const {
  MessageEmbed,
} = require('discord.js')
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

async function generateListEmbed(playlist) {
  const embed = new MessageEmbed()
    .setColor(0x050100)
    .setTitle("Current Playlist")
    .setDescription("> Playlist can be expanded via **PLAY**, skipped via **SKIP**, remove particular listing via **REMOVE** or cleared completely via **CLEAR**.")

  for(track of playlist) {

    let embedName = "";

    if(track.id == 1) {
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
}
