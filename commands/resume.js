const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume playback'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		if (mp.isEmpty()) return 'You have not added any music';

		if (mp.isPaused()) {
			mp.player.unpause();
			return 'Resuming playback';
		}
		else if (mp.isPlaying()) {
			return 'Audio is already playing';
		}
		else {
			mp.playTrack();
			return 'Resuming playback';
		}
	},
};