require('dotenv').config();
const readline = require('readline');
const Discord = require('discord.js');
const { collectCommands } = require('./collect-commands.js');

/**
 * Deploys commands to a specific server
 * @param {String[]} commandData - Array of command data as JSON strings
 * @param {String} token - Discord token
 * @param {String} clientID - Discord client ID
 * @param {String} serverID - Discord server ID
 * @returns {Promise<void>}
 */
async function deployToServer (commandData, token, clientID, serverID) {
    const rest = new Discord.REST().setToken(token);

    try {
        console.log(`Deploying ${commandData.length} commands to ${serverID}...`);
        const data = await rest.put(
            Discord.Routes.applicationGuildCommands(clientID, serverID),
            { body: commandData }
        );
        console.log(`Successfully deployed ${data.length} commands.`);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Deploys commands globally.
 * @param {String[]} commandData - Array of command data as JSON strings
 * @param {String} token - Discord token
 * @param {String} clientID - Discord client ID
 * @returns {Promise<void>}
 */
async function deployGlobal (commandData, token, clientID) {
    const rest = new Discord.REST().setToken(token);

    try {
        console.log(`Deploying ${commandData.length} commands globally...`);
        const data = await rest.put(
            Discord.Routes.applicationCommands(clientID),
            { body: commandData }
        );
        console.log(`Successfully deployed ${data.length} commands.`);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Deploy either globally or to a server depending on environment variables
 * @returns {Promise<void>}
 */
async function deploy () {
    if (process.env.DEPLOY_COMMANDS_GLOBALLY === 'true') {
        await deployGlobal(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID);
    } else {
        await deployToServer(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID,
            process.env.DEPLOY_COMMANDS_SERVER_ID);
    }
}

/**
 * Ask the user if they are okay with the deployment settings, then proceed with deployment if they are.
 */
async function deployWithConfirmation () {
    const rl = readline.createInterface(process.stdin, process.stdout);
    if (process.env.DEPLOY_COMMANDS_GLOBALLY === 'true') {
        console.log('Configured to deploy commands globally.');
        await rl.question('Ok to proceed? (y) ', async answer => {
            if (answer === 'y') {
                await deployGlobal(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID);
            } else {
                console.log('Deployment cancelled');
            }
            rl.close();
        });
    } else {
        console.log(`Configured to deploy commands to server with ID ${process.env.DEPLOY_COMMANDS_SERVER_ID}.`);
        await rl.question('Ok to proceed? (y) ', async answer => {
            if (answer === 'y') {
                await deployToServer(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID,
                    process.env.DEPLOY_COMMANDS_SERVER_ID);
            } else {
                console.log('Deployment cancelled');
            }
            rl.close();
        });
    }
}

if (!process.env.BOT_TOKEN) {
    console.error('ERROR: BOT_TOKEN is not specified in .env or anywhere else.');
    process.exit(1);
} else if (!process.env.DEPLOY_CLIENT_ID) {
    console.error('ERROR: DEPLOY_CLIENT_ID is not specified in .env or anywhere else.');
    process.exit(1);
} else if (process.env.DEPLOY_COMMANDS_GLOBALLY !== 'true' && !process.env.DEPLOY_COMMANDS_SERVER_ID) {
    console.error('ERROR: If not deploying commands globally then DEPLOY_COMMANDS_SERVER_ID needs to be specified in' +
        ' .env or elsewhere.');
    process.exit(1);
}

const commands = collectCommands();
const commandData = [];
commands.forEach(command => {
    commandData.push(command.data.toJSON());
});
console.log(`Collected ${commandData.length} commands.`);

(async () => {
    if (process.env.DEPLOY_NEEDS_CONFIRMATION === 'true') {
        await deployWithConfirmation();
    } else {
        await deploy();
    }
})();
