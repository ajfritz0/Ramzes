const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Plays next audio track in queue')
		.addIntegerOption(option => {
			return option.setName('num')
				.setDescription('Track Number');
		}),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		const trackNum = interaction.options.getInteger('num');

		if (trackNum == null || trackNum == undefined) {
			const doesExist = mp.playNext();
			if (!doesExist) {
				return 'No track selected';
			}
		}
		else {
			const doesExist = mp.playTrack(trackNum);
			if (!doesExist) {
				return 'That track does not exist';
			}
		}
		return 'Playing next track';
	},
};