const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the playlist queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		mp.shuffle();

		return interaction.reply('Playlist has been shuffled')
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};