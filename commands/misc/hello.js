const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Say hello!'),
    async execute (interaction) {
        if (interaction.user && interaction.user.username) {
            await interaction.reply(`Hello, ${interaction.user.username}!`);
        } else {
            await interaction.reply('Hello, whoever you are!');
        }
    }
};
