require('dotenv').config();
const readline = require('readline');
const Discord = require('discord.js');
const { collectCommands } = require('./collect-commands.js');

async function deployToServer (commandData, token, clientID, serverID) {
    const rest = new Discord.REST().setToken(token);

    try {
        console.log(`Deploying ${commandData.length} commands to ${serverID}...`);
        const data = await rest.put(
            Discord.Routes.applicationGuildCommands(clientID, serverID),
            { body: commandData }
        );
        console.log(`Succesfully deployed ${data.length} commands.`);
    } catch (error) {
        console.error(error);
    }
}

async function deployGlobal (commandData, token, clientID) {
    const rest = new Discord.REST().setToken(token);

    try {
        console.log(`Deploying ${commandData.length} commands globally...`);
        const data = await rest.put(
            Discord.Routes.applicationCommands(clientID),
            { body: commandData }
        );
        console.log(`Succesfully deployed ${data.length} commands.`);
    } catch (error) {
        console.error(error);
    }
}

function deploy () {
    if (process.env.DEPLOY_COMMANDS_GLOBALLY === 'true') {
        deployGlobal(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID);
    } else {
        deployToServer(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID, process.env.DEPLOY_COMMANDS_SERVER_ID);
    }
}

function deployWithConfirmation () {
    const rl = readline.createInterface(process.stdin, process.stdout);
    if (process.env.DEPLOY_COMMANDS_GLOBALLY === 'true') {
        console.log('Configured to deploy commands globally.');
        rl.question('Ok to proceed? (y) ', answer => {
            if (answer === 'y') {
                deployGlobal(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID);
            } else {
                console.log('Deployment cancelled');
            }
            rl.close();
        });
    } else {
        console.log(`Configured to deploy commands to server with ID ${process.env.DEPLOY_COMMANDS_SERVER_ID}.`);
        rl.question('Ok to proceed? (y) ', answer => {
            if (answer === 'y') {
                deployToServer(commandData, process.env.BOT_TOKEN, process.env.DEPLOY_CLIENT_ID, process.env.DEPLOY_COMMANDS_SERVER_ID);
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
    console.error('ERROR: If not deploying commands globally then DEPLOY_COMMANDS_SERVER_ID needs to be specified in .env or elsewhere.');
    process.exit(1);
}

const commands = collectCommands();
const commandData = [];
commands.forEach(command => {
    commandData.push(command.data.toJSON());
});
console.log(`Collected ${commandData.length} commands.`);

if (process.env.DEPLOY_NEEDS_CONFIRMATION === 'true') {
    deployWithConfirmation();
} else {
    deploy();
}
