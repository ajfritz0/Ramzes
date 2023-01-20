const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Queue a track to play'),
	async execute(interaction) {
		const mpCollection = interaction.client.MusicPlayerCollection;
		const mp = mpCollection.get(interaction.guild.id);
		if (mp === null || mp === undefined) return interaction.reply('You have not added any music');
		const content = mp.showUpcoming();
		const embed = new EmbedBuilder()
			.setTitle('Queued songs:')
			.setDescription(content);
		interaction.reply({
			embeds: [embed],
		});
	},
};