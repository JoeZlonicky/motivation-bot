const { SlashCommandBuilder } = require('discord.js');
const NicknameModel = require('../database-models/nickname');

/**
 * Attempts to set a nickname for the given Discord user.
 * @param {string} userID - Discord ID
 * @param {string} nickname - Name to set
 * @returns {Promise<boolean>} - Whether the operation was successfully
 */
async function trySetNickname (userID, nickname) {
    const filterByUser = { userID };
    const newDocument = { userID, nickname };
    const updateOptions = { upsert: true, new: true };

    console.log(`Updating name for user ${userID} to "${nickname}"...`);
    try {
        const updatedDocument = await NicknameModel.findOneAndUpdate(filterByUser,
            newDocument,
            updateOptions).exec();
        console.log(`Name updated to "${updatedDocument.nickname}".`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

/**
 * Attempts to clear any nickname given to the user.
 * @param userID - Discord ID
 * @returns {Promise<number>} - Number of deleted documents. Returns -1 if operation failed.
 */
async function tryClearNickname (userID) {
    console.log(`Clearing nickname for user ${userID}...`);
    try {
        const result = await NicknameModel.deleteMany({ userID }).exec();
        const nDeleted = result.deletedCount;
        console.log(`Deleted ${nDeleted} documents.`);
        return nDeleted;
    } catch (error) {
        console.error(error);
        return -1;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('call-me')
        .setDescription('Give yourself a nickname for the bot to use.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Set a new nickname')
                .addStringOption(option => option.setName('name')
                    .setDescription('The nickname').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('clear')
                .setDescription('Clear the current nickname')),
    async execute (interaction) {
        await interaction.deferReply();

        const userID = interaction.user.id;
        if (interaction.options.getSubcommand() === 'set') {
            const nickname = interaction.options.get('name').value;

            const success = trySetNickname(userID, nickname);
            if (success) {
                await interaction.editReply(`You got it, ${nickname}!`);
            } else {
                await interaction.editReply('I\'m sorry, but I was unable to update your nickname!');
            }
        } else if (interaction.options.getSubcommand() === 'clear') {
            const nCleared = await tryClearNickname(userID);
            if (nCleared > 0) {
                await interaction.editReply('Cleared!');
            } else if (nCleared === 0) {
                await interaction.editReply('You don\'t have a nickname to clear!');
            } else if (nCleared < 0) {
                await interaction.editReply('I\'m sorry, but I was unable to clear your nickname!');
            }
        } else {
            console.log(`WARNING: Unknown subcommand "${interaction.options.getSubcommand()}".`);
            await interaction.editReply('I\'m sorry, but I am not set-up to handle that command!');
        }
    }
};
