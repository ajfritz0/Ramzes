const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prev')
		.setDescription('Play the previous track in the queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;

		if (mp.isEmpty()) return 'The queue is empty';
		if (!mp.playPrev()) {
			return 'There is no previous track';
		}
		return 'Playing previous track';
	},
};