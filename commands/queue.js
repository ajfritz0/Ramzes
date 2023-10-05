const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Queue a track to play')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Track id to list from (defaults to current track)'),
		),
	voiceChannelRequired: false,
	async execute(interaction) {
		const mp = interaction.client.mp;
		const id = interaction.options.getInteger('id');

		if (mp.isEmpty()) return 'There are no songs in the queue';
		const content = mp.showUpcoming(id);
		const embed = new EmbedBuilder()
			.setTitle('Queued songs:')
			.setDescription(content);
		return {
			embeds: [embed],
		};
	},
};