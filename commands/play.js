const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  generateDependencyReport
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      "Join a channel and plays external source media"
    ),
  async execute(interaction) {
    const voiceChannel = interaction.guild.members.cache.get(interaction.member.user.id).voice.channel;
    if(!voiceChannel) {
      await interaction.reply("```You need to be in a Channel to execute this command.```");
    }else{

      // Check for "CONNECT" and "SPEAK" permissions

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      // Change this to input
      const stream = ytdl('https://www.youtube.com/watch?v=3CFQYmP5ZVg', {
        filter: 'audioonly'
      });
      const player = createAudioPlayer();

      let resource = createAudioResource(stream, {
        inlineVolume: true
      });
      resource.volume.setVolume(0.25);

      connection.subscribe(player);
      player.play(resource);

      await interaction.reply("```Playin!```");
    }
  },
};
