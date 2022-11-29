const {
  SlashCommandBuilder
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription(
      "Info of Cytokine-Harmony bot"
    ),
  async execute(interaction) {
    await interaction.reply(
      "```This bot is created by SammyDeAgent and its sole purpose is to broadcast music from external source.```"
    );
  },
};
