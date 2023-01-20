const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const ytsr = require('ytsr');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search youtube for a video')
		.addStringOption(option => {
			return option.setName('query')
				.setDescription('search query')
				.setRequired(true);
		}),
	async execute(interaction) {
		const query = interaction.options.getString('query');

		try {
			const results = await ytsr(query, {
				limit: 20,
			});
			let counter = 0;
			const description = results.items.reduce((prev, curr) => {
				if (curr.type != 'video' || curr?.isLive == true) return prev;
				counter += 1;
				return prev.concat([`${counter}. [${curr.title}](${curr.duration})`]);
			}, []).slice(0, 10).join('\n');

			const embed = new EmbedBuilder()
				.setTitle('Search Results')
				.setDescription('```md\n' + description + '\n```')
				.setColor('#77AAFF');
			return interaction.reply({
				embeds: [embed],
			});
		}
		catch (e) {
			console.error(e);
			return interaction.reply('Sorry, an unexpected error occurred');
		}
	},
};