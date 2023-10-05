const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the playlist queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		if (mp.isEmpty()) return 'There are no items in the queue';

		mp.shuffle();
		return 'Queue has been shuffled';
	},
};