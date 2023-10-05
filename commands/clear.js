const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the playlist queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		interaction.client.mp.clearPlaylist();
		return 'Playlist cleared.';
	},
};