const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  MessageEmbed,
} = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription(
      "Info of Cytokine-Harmony bot"
    ),
  async execute(interaction) {

    const sender = interaction.member.user;

    const embed = new MessageEmbed()
      .setColor(0x4f7942)
      .setTitle("Cytokine Harmony")
      .setDescription("A loney music bot listening to sea waves.\nCreated by [Sammy](https://github.com/SammyDeAgent) with a surplus of tea.")
      .setFields([{
          name: 'Collaborators',
          value: 'Sammy (SammyDeAgent)\nSean (DrDubuPHD)\nDerpy\n',
        }
      ])
      .setAuthor({
        name: 'The Cytokine Group',
        iconURL: 'https://avatars.githubusercontent.com/u/66596766?v=4',
        url: 'https://discord.gg/Stnm6DC'
      })
      .setThumbnail(
        `https://duckduckgo.com/assets/icons/favicons/youtube.png`
      )
      .setImage(
        `https://cdn.discordapp.com/app-icons/889823032154157056/b546bd5036ca07a22bbdf5ef33a32569.png?size=128&quot`
      )
      .setTimestamp()
      .setFooter({
        text: `Weaving Sound Waves...`,
        iconURL: `https://cdn.discordapp.com/app-icons/889823032154157056/b546bd5036ca07a22bbdf5ef33a32569.png?size=256&quot`
      });
      ;
            
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  },
};
