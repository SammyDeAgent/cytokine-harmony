const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  generateDependencyReport
} = require('@discordjs/voice');
// const ytdl = require('ytdl-core');
const ytdl = require('play-dl');
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

    await interaction.deferReply();

    const voiceChannel = await interaction.guild.members.cache.get(interaction.member.user.id).voice.channel;
    if (!voiceChannel) {
      await interaction.reply("```You need to be in a Channel to execute this command.```");
    } else {

      // Joins the user's channel
      var connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
      }

      // Check for "CONNECT" and "SPEAK" permissions

      const videoFinder = async (query) => {
        const videoResult = await ytSearch(query);
        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
      }


      // Retrieving the string behind /play
      const query = await interaction.options.getString("query");

      
      // Check the query if matches a url
      const video = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(query) ? { url: query } : await videoFinder(query);

      if (video) {
        const stream = await ytdl.stream(video.url);

        let resource = createAudioResource(stream.stream, {
          inlineVolume: true,
          inputType: stream.type,
        });
        resource.volume.setVolume(0.1);

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
          }
        });

        connection.subscribe(player);
        player.play(resource);

        // await interaction.reply(`Playing - ${video.url}`);
        await interaction.editReply({
          content: `Playing - ${video.url}`
        });
      } else {
        await interaction.reply("```Could not find any search results.```");
      }
    }
  },
};
