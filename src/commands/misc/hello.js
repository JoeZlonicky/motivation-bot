const { SlashCommandBuilder } = require('discord.js');
const getName = require('../../utility/get-name');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Say hello!'),
    async execute (interaction) {
        await interaction.deferReply(); // Querying database for nickname may take a moment

        const name = await getName(interaction.user);
        if (name) {
            await interaction.editReply(`Hello, ${name}!`);
        } else {
            await interaction.editReply('Hello, whoever you are!');
        }
    }
};
