const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops currently playing audio'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		mp.stop();

		return 'Playback stopped';
	},
};