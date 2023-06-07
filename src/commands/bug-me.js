const { SlashCommandBuilder } = require('discord.js');
const getName = require('../utility/get-name');
const Reminder = require('../database-models/reminder');

const DEFAULT_INTERVAL_MINUTES = 60;
const MAX_INTERVAL_MINUTES = 60 * 24 * 7; // 7 days

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bug-me')
        .setDescription('Set a reminder and I\'ll keep messaging you until you have confirmed you have done it.')
        .addIntegerOption(option =>
            option.setName('interval').setDescription(
                `How often to remind you (in minutes). Default is ${DEFAULT_INTERVAL_MINUTES} minutes.`)
                .setMinValue(1)
                .setMaxValue(MAX_INTERVAL_MINUTES)
        )
        .addStringOption(option =>
            option.setName('what').setDescription('What to remind you to do.')),
    async execute (interaction) {
        await interaction.deferReply(); // May take a moment

        const intervalMinutes = interaction.options.getInteger('interval') || DEFAULT_INTERVAL_MINUTES;
        const what = interaction.options.getString('what') || '';
        const newReminder = new Reminder({ userID: interaction.user.id, what, intervalMinutes });
        try {
            await newReminder.save();
            console.log('Reminder saved!');

            const name = await getName(interaction.user);
            if (name) {
                await interaction.editReply(`I've set the reminder. Go get 'em ${name}!`);
            } else {
                await interaction.editReply('I\'ve set the reminder. Go get \'em!');
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('I\'m sorry, but I was unable to set that reminder!');
        }
    }
};
