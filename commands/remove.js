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
		if (mp.isEmpty()) return interaction.reply({ content: 'There is no items in the play queue', ephemeral: true });

		const track = interaction.options.getInteger('track');
		if (!mp.removeTrack(track)) return interaction.reply({ content: 'That track item does not exist', ephemeral: true });
		return interaction.reply('Track Removed').then(() => setTimeout(() => interaction.deleteReply(), 5000)).catch(console.error);
	},
};