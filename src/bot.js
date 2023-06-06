require('dotenv').config();
const Discord = require('discord.js');
const mongoose = require('mongoose');
const collectCommands = require('./collect-commands.js');
const CommandHandler = require('./command-handler.js');
const ReminderPoller = require('./reminder-poller');

(async () => {
    if (!process.env.BOT_TOKEN) {
        console.error('ERROR: BOT_TOKEN is not specified in .env or anywhere else. Terminating bot...');
        process.exitCode = 1;
        return;
    }

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI is not specified in .env or anywhere else. Terminating bot...');
        process.exitCode = 1;
        return;
    }

    console.log('Setting up...');
    // See https://discord.com/developers/docs/topics/gateway#gateway-intents
    // Note: Guild is the internal name for what most people call servers
    const client = new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMessages
        ]
    });

    const commands = collectCommands();
    console.log(`Collected ${commands.size} command(s)...`);

    const commandHandler = new CommandHandler(commands);
    client.on(Discord.Events.InteractionCreate, async interaction => {
        await commandHandler.handleCommand(interaction);
    });

    console.log('Connecting to database...');
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
        return;
    }

    console.log('Logging in...');
    try {
        await client.login(process.env.BOT_TOKEN);
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
        return;
    }

    console.log('Setting up reminder poller...');
    const reminderPoller = new ReminderPoller(client);
    reminderPoller.startPolling();

    console.log('All set up!');
})();
