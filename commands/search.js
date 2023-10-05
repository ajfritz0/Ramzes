const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
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
	voiceChannelRequired: false,
	async execute(interaction) {
		const query = interaction.options.getString('query');

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
		return {
			embeds: [embed],
		};
	},
};