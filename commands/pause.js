const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause playing audio'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		if (mp.isPaused()) return interaction.reply({ content: 'Audio is already paused', ephemeral: true });
		mp.player.pause();

		return interaction.reply('Pausing Playback')
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};