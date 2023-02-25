const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Queue a track to play'),
	async execute(interaction) {
		const mp = interaction.client.mp;

		if (mp.isEmpty()) return interaction.reply('There are no songs in the queue');
		const content = mp.showUpcoming();
		const embed = new EmbedBuilder()
			.setTitle('Queued songs:')
			.setDescription(content);
		interaction.reply({
			embeds: [embed],
		});
	},
};