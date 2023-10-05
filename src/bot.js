const { Events, Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('../config/config.json');
const fs = require('fs');
const MusicPlayer = require('./MusicPlayer');
const logger = require('./lib/Logger');
const { toTimeString } = require('./lib/utils');

// Events
const interactionCreate = require('./Events/InteractionCreate');
const voiceStateUpdate = require('./Events/VoiceStateUpdate');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const mp = client.mp = new MusicPlayer();
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandData = [];

let textChannel = null;
let lastSentMessage = null;

for (const file of commandFiles) {
	logger.info(`Loading Module ${file}`);
	const command = require(`../commands/${file}`);
	client.commands.set(command.data.name, command);
	commandData.push(command.data);
}

client.once(Events.ClientReady, () => {
	logger.info('Ready!');
});
client.on(Events.InteractionCreate, (interaction) => {
	if (textChannel == null && interaction.channel.type == 'GUILD_VOICE') textChannel = interaction.guild.systemChannel;
	else textChannel = interaction.channel;
});
client.on(Events.InteractionCreate, interactionCreate);
client.on(Events.VoiceStateUpdate, voiceStateUpdate);
mp.on('playing', (video) => {
	const timeString = toTimeString(video.duration);
	const embed = new EmbedBuilder()
		.setTitle(video.title)
		.setAuthor({
			name: video.author_name,
			url: video.author_url,
		})
		.setURL(video.video_url)
		.setThumbnail(video.thumbnail)
		.setTimestamp()
		.addFields(
			{
				name: 'Duration',
				value: timeString,
				inline: true,
			},
		);
	if (lastSentMessage !== null && lastSentMessage.deletable) {
		lastSentMessage.delete();
	}
	lastSentMessage = textChannel.send({
		embeds: [embed],
	});
});

require('./deploy')(commandData)
	.then(() => {
		client.login(token);
	})
	.catch(err => {
		logger.error(err);
	});