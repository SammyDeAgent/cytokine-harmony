const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  generateDependencyReport
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      "Join a channel and plays external source media"
    ).addStringOption(option =>
		    option.setName('query')
			    .setDescription('Search term YT')
			    .setRequired(true)
    ),
  async execute(interaction) {

    const voiceChannel = interaction.guild.members.cache.get(interaction.member.user.id).voice.channel;
    if (!voiceChannel) {
      await interaction.reply("```You need to be in a Channel to execute this command.```");
    } else {

      // Joins the user's channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      // Check for "CONNECT" and "SPEAK" permissions

      const videoFinder = async (query) => {
        const videoResult = await ytSearch(query);
        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
      }

      const video = await videoFinder(interaction.options.getString("query"));
      if (video) {
        const stream = ytdl(video.url, {
          filter: 'audioonly',
          opusEncoded: true,
          dlChunkSize: 0,
          highWaterMark: 1 << 25,
        });
        const player = createAudioPlayer();

        let resource = createAudioResource(stream, {
          inlineVolume: true
        });
        resource.volume.setVolume(0.1);

        connection.subscribe(player);
        player.play(resource);

        await interaction.reply(`Playing - ${video.url}`);
      }else {
        await interaction.reply("```Could not find any search results.```");
      }
    }
  },
};
