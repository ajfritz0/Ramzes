const { Client, Collection, Intents } = require('discord.js');
const { token } = require('../config/config.json');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

client.commands = new Collection();
client.MusicPlayerCollection = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	console.log(`Loading Module ${file}`);
	const command = require(`./command/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	const start = (new Date()).getTime();
	try {
		await command(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
	const deltaTime = (new Date()).getTime() - start;
	console.log(`Execution finished in ${deltaTime}ms`);
});

client.login(token);
