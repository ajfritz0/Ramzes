const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Turns looping on/off')
		.addBooleanOption(option => {
			return option.setName('value')
				.setDescription('True/False')
				.setRequired(true);
		}),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		const loop = interaction.options.getBoolean('value');

		mp.loop = loop;
		return (loop) ? 'Playlist will loop' : 'Playlist looping disabled';
	},
};