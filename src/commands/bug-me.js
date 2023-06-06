const { SlashCommandBuilder } = require('discord.js');
const ReminderModel = require('../database-models/reminder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bug-me')
        .setDescription('Set a reminder and I\'ll keep messaging you until you have confirmed you have done it.')
        .addIntegerOption(option =>
            option.setName('interval').setDescription('How often to remind you. Default is 60 minutes.').setMinValue(1)
        )
        .addStringOption(option =>
            option.setName('what').setDescription('What to remind you to do.')),
    async execute (interaction) {
        await interaction.deferReply(); // May take a moment

        const intervalMinutes = interaction.options.getInteger('interval') || 60;
        const what = interaction.options.getString('what') || '';
        const newDocument = new ReminderModel({ userID: interaction.user.id, what, intervalMinutes });
        await newDocument.save();
        console.log('Reminder added!');

        await interaction.editReply('Set reminder!');
    }
};
