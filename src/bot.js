require('dotenv').config();
const Discord = require('discord.js');
const mongoose = require('mongoose');
const { collectCommands } = require('./collect-commands.js');
const { CommandHandler } = require('./command-handler.js');

if (!process.env.BOT_TOKEN) {
    console.error('ERROR: BOT_TOKEN is not specified in .env or anywhere else.');
    process.exit(1);
}

console.log('Creating client...');
// See https://discord.com/developers/docs/topics/gateway#gateway-intents
// Note: Guild is the internal name for what most people call servers
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages
    ]
});
console.log('Client created.');

console.log('Collecting commands...');
const commands = collectCommands();
console.log(`Collected ${commands.size} command(s).`);

console.log('Setting up command handler...');
const commandHandler = new CommandHandler(commands);
client.on(Discord.Events.InteractionCreate, async interaction => {
    await commandHandler.handleCommand(interaction);
});
console.log('Command handler set up.');

(async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to database.');

        console.log('Logging in...');
        await client.login(process.env.BOT_TOKEN);
        console.log('Connected!');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
