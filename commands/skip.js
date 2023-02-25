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
				return interaction.reply({
					content: 'No track selected',
					ephemeral: true,
				});
			}
		}
		else {
			const doesExist = mp.playTrack(trackNum);
			if (!doesExist) {
				return interaction.reply({
					content: 'That track does not exist',
					ephemeral: true,
				});
			}
		}
		return interaction.reply('Playing next track')
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};