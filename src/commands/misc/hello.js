const { SlashCommandBuilder } = require('discord.js');
const NicknameModel = require('../../database-models/nickname');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Say hello!'),
    async execute (interaction) {
        await interaction.deferReply(); // Querying database for nickname may take a moment

        let nicknameDocument = null;
        try {
            console.log(`Checking for nickname for user with id "${interaction.user?.id}".`);
            nicknameDocument = await NicknameModel.findOne({ userID: interaction.user?.id }).exec();
            console.log(`Found: ${nicknameDocument?.nickname}`);
        } catch (error) {
            console.error(error);
        }
        if (nicknameDocument && nicknameDocument.nickname) {
            await interaction.editReply(`Hello, ${nicknameDocument.nickname}!`);
        } else if (interaction.user && interaction.user.username) {
            await interaction.editReply(`Hello, ${interaction.user.username}!`);
        } else {
            await interaction.editReply('Hello, whoever you are!');
        }
    }
};
