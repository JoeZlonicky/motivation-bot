const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js');

const COMMAND_DIRECTORY = path.join(__dirname, '..', 'commands');

function tryAddingCommand (filePath, commands) {
    const command = require(filePath);

    if (!('data' in command)) {
        console.log(`WARNING: The command at ${filePath} is missing a "data" property.`);
        return;
    }

    if (!('execute' in command)) {
        console.log(`WARNING: The command at ${filePath} is missing an "execute" method.`);
        return;
    }

    if (command.data.name in commands) {
        console.log(`WARNING: The command at ${filePath} is using an already existing name "${command.data.name}".`);
        return;
    }

    commands.set(command.data.name, command);
}

/**
 * Tries to collect all of the command .js files in the command directory.
 * @returns A Discord.Collection (a map data structure) mapping command name to a loaded command
 */
function collectCommands () {
    const commands = new Discord.Collection();
    const directoryStack = [COMMAND_DIRECTORY]; // Depth-first search

    while (directoryStack.length > 0) {
        const currentDirectory = directoryStack.pop();
        const files = fs.readdirSync(currentDirectory); // Here file also means directory

        files.forEach((file) => {
            const filePath = path.join(currentDirectory, file);

            if (fs.statSync(filePath).isDirectory()) {
                directoryStack.push(filePath);
            } else if (filePath.endsWith('.js')) {
                tryAddingCommand(filePath, commands);
            }
        });
    }

    return commands;
}

module.exports = {
    collectCommands
};
