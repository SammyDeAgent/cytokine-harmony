// Module Imports
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageButton
} = require('discord.js')
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');
const {
  joinVoiceChannel,
  createAudioPlayer,
  getVoiceConnection,
  NoSubscriberBehavior,
  AudioPlayerStatus,
} = require('@discordjs/voice');

const {
  generateSearchEmbed,
  generateEmbed,
  searchFinder,
  playerPlay
} = require('./modules/common.js');

// Importing Queue Class
const Queue = require('../class/queueClass.js');

// Variable
var player = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription(
      "Search up to 10 songs from YT search"
    ).addStringOption(option =>
      option.setName('query')
      .setDescription('Search term YT')
      .setRequired(true)
    ),
  async execute(interaction) {

    await interaction.deferReply({
      ephemeral: true
    });

    const sender = interaction.member.user;
    const msgChannel = await interaction.channelId;
    const voiceChannel = await interaction.guild.members.cache.get(sender.id).voice.channel;
  
    if (!voiceChannel) {
      await interaction.editReply("```You need to be in a Channel to execute this command.```");
    } else {

      // Get the connection status of the channel
      var connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // 06/03/2022 - API Fix
        connection.on('stateChange', (oldState, newState) => {
          const oldNetworking = Reflect.get(oldState, 'networking');
          const newNetworking = Reflect.get(newState, 'networking');

          const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
          }

          oldNetworking?.off('stateChange', networkStateChangeHandler);
          newNetworking?.on('stateChange', networkStateChangeHandler);
        });

        player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Idle
          }
        });

        player.playlist = new Queue();

        connection.subscribe(player);

        // Idling event handler
        player.on(AudioPlayerStatus.Idle, async () => {

          player.playlist.rmFinSong();

          if (!player.playlist.isEmpty()) {
            let curStream = player.playlist.getNextSong();

            playerPlay(curStream.stream, player);

            // Reply Embed + API call for YT Channel Picture
            let channel_key = (curStream.video.channel.url).split("/")[(curStream.video.channel.url).split("/").length - 1];
            let embed = await generateEmbed(channel_key, curStream.video, curStream.sender);

            await interaction.guild.channels.cache.get(msgChannel).send({
              embeds: [embed]
            })
          } else {
            setTimeout(() => {
              if (player.playlist.isEmpty())
                connection.destroy();
            }, 30000);
          }
        });
        
      } else {
        player = connection._state.subscription.player;
      }

      // Check for "CONNECT" and "SPEAK" permissions

      // Retrieving the string behind /search
      const query = await interaction.options.getString("query");

      // Check the query if matches a url
      const searchList =
        /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(query) ?
        await searchFinder(encodeURI(query)) :
        await searchFinder(query);

      if(searchList) {
        const dropdownInsert = new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId("search_select")
              .setPlaceholder("Select a track to insert"),
          )
        
        const dropdownBuilder = [];
        for(item of searchList) {
          dropdownBuilder.push({
            label: `Result - ${item.id}`,
            description: `${item.title}`,
            value: `${item.url}`,
          })
        };
  
        dropdownInsert.components[0].addOptions(dropdownBuilder);

        const cancelBtn = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('search_cancel')
              .setLabel('Cancel')
              .setStyle('DANGER'),
          )

        await interaction.editReply({
          embeds: [await generateSearchEmbed(searchList)],
          components: [dropdownInsert, cancelBtn],
        });
      }else {
        await interaction.editReply("```Could not find any search results.```");
      }
        
    }

  }
};