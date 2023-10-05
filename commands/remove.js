const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a track from the play queue')
		.addIntegerOption(option =>
			option.setName('track')
				.setDescription('The track number of the item to remove')
				.setRequired(true),
		),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		if (mp.isEmpty()) return 'There are no items in the queue';

		const track = interaction.options.getInteger('track');
		if (!mp.removeTrack(track)) return 'That track item does not exist';
		return 'Track Removed';
	},
};