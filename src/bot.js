const { Events, Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('../config/config.json');
const fs = require('fs');
const MusicPlayer = require('./MusicPlayer');
const validate = require('./validateMemberVoiceState');
const logger = require('./Logger');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.mp = new MusicPlayer();
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandData = [];

for (const file of commandFiles) {
	logger.info(`Loading Module ${file}`);
	const command = require(`../commands/${file}`);
	client.commands.set(command.data.name, command);
	commandData.push(command.data);
}

client.once(Events.ClientReady, () => {
	logger.info('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (client.mp.textChannel == null && interaction.channel.type == 'GUILD_VOICE') client.mp.textChannel = interaction.guild.systemChannel;
	else client.mp.textChannel = interaction.channel;

	logger.info(`Interaction\n\tCommand: ${interaction.commandName} / User: ${interaction.user.username}\n\tChannel: ${interaction.channel.name} / Guild: ${interaction.guild.name}`);
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
		logger.error('Failed to execute slash command');
		logger.error(error.message);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
	const deltaTime = (new Date()).getTime() - start;
	logger.info(`Execution finished in ${deltaTime}ms`);
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
	const botId = client.user.id;
	const botVoiceState = newState.guild.voiceStates.cache.get(botId);
	if (!botVoiceState || !botVoiceState.channelId) return;

	const voiceChannelMembers = botVoiceState.channel.members;
	for (const [memberId] of voiceChannelMembers) {
		if (memberId == botId) continue;
		client.mp.stopLonelyTimer();
		return;
	}

	client.mp.startLonelyTimer();
});

require('./deploy')(commandData)
	.then(() => {
		client.login(token);
	})
	.catch(err => {
		console.error(err);
	});
