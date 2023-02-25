const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume playback'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		if (mp.isEmpty()) return interaction.reply({ content: 'You have not added any music', ephemeral: true });

		if (mp.isPaused()) {
			mp.player.unpause();
			interaction.reply('Resuming playback')
				.then(() => setTimeout(() => interaction.deleteReply(), 5000))
				.catch(console.error);
		}
		else if (mp.isPlaying()) {
			interaction.reply('Audio is already playing')
				.then(() => setTimeout(() => interaction.deleteReply(), 5000))
				.catch(console.error);
		}
		else {
			const test = mp.playTrack();
			if (!test) {
				return interaction.reply({
					content: 'Unable to resume playback',
					ephemeral: true,
				});
			}
			return interaction.reply('Resuming playback')
				.then(() => setTimeout(() => interaction.deleteReply(), 5000))
				.catch(console.error);
		}
	},
};