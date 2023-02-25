const { Events, Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('../config/config.json');
const fs = require('fs');
const MusicPlayer = require('./MusicPlayer');
const validate = require('./validateMemberVoiceState');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.mp = new MusicPlayer();
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandData = [];

for (const file of commandFiles) {
	console.log(`Loading Module ${file}`);
	const command = require(`../commands/${file}`);
	client.commands.set(command.data.name, command);
	commandData.push(command.data);
}

client.once(Events.ClientReady, () => {
	console.log('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	const start = (new Date()).getTime();
	try {
		if (command.voiceChannelRequired) {
			if (validate(interaction)) await command.execute(interaction);
		}
		else {
			await command.execute(interaction);
		}
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
	const deltaTime = (new Date()).getTime() - start;
	console.log(`Execution finished in ${deltaTime}ms`);
});

require('./deploy')(commandData)
	.then(() => {
		client.login(token);
	})
	.catch(err => {
		console.error(err);
	});
