const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the playlist queue'),
	async execute(interaction) {
		const mpCollection = interaction.client.MusicPlayerCollection;
		const mp = mpCollection.get(interaction.guild.id);
		if (mp === null || mp == undefined) return interaction.reply('Nothing to clear');
		mp.clearPlaylist();
		return interaction.reply('Playlist cleared');
	},
};