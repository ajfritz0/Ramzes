const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause playing audio'),
	voiceChannelRequired: true,
	async execute(interaction) {
		if (interaction.client.mp.isPaused()) return 'Playback is already paused';

		interaction.client.mp.pause();
		return 'Pausing Playback';
	},
};