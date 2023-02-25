const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('../config/config.json');

module.exports = async (commandData) => {
	const args = process.argv.slice(2);
	if (args.includes('--no-deploy')) return;

	const rest = new REST({ version: '10' }).setToken(token);

	console.log('Refreshing application commands...');
	let data = null;
	if (args.includes('--dev')) {
		data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commandData },
		);
	}
	else {
		data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commandData },
		);
	}

	console.log(`Successfully reloaded ${data.length} application commands.`);
};