const { SlashCommandBuilder } = require('discord.js');
const ytsr = require('ytsr');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a track to the queue')
		.addSubcommand(subcommand =>
			subcommand
				.setName('link')
				.setDescription('Add video via url')
				.addStringOption(option =>
					option
						.setName('url')
						.setDescription('URL')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('search')
				.setDescription('Add video via search')
				.addStringOption(option =>
					option
						.setName('query')
						.setDescription('Search Query')
						.setRequired(true),
				).addIntegerOption(option =>
					option
						.setName('id')
						.setDescription('The ID of the video to add'),
				),
		),
	voiceChannelRequired: true,
	async execute(interaction) {
		const url = interaction.options.getString('url');
		const query = interaction.options.getString('query');
		const id = interaction.options.getInteger('id');
		const mp = interaction.client.mp;
		const subCommand = interaction.options.getSubcommand();

		if (subCommand == 'link') {
			const index = await mp.add(url);
			if (index == -1) {
				return 'The URL provided was not valid';
			}
			return `${mp.playlist.size() - index} track(s) added`;
		}
		else {
			const searchResults = await ytsr(query, {
				limit: 20,
			});
			const filteredResults = searchResults.items.filter(value => {
				if (value.type != 'video' || value?.isLive) return false;
				return true;
			}).slice(0, 10);

			if (id && (id < 1 || id > 10)) {
				return 'The id provided is out of range';
			}
			const trackSelected = (id) ? id - 1 : 0;

			const index = await mp.add(filteredResults[trackSelected].url);
			if (index == -1) {
				return 'There was an error while attempting to add the track from your query.\nPlease try again later';
			}
			return 'Track added';
		}
	},
};