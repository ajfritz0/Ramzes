const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the playlist queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		interaction.client.mp.clearPlaylist();
		return interaction.reply('Playlist Cleared')
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};