const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Plays next audio track in queue')
		.addIntegerOption(option => {
			return option.setName('num')
				.setDescription('Track Number');
		}),
	async execute(interaction) {
		const mp = interaction.client.MusicPlayerCollection.get(interaction.guild.id);
		if (mp === null || mp === undefined) return interaction.reply('You have not added any music');
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
		return interaction.reply({
			content: 'Playing music',
			ephemeral: true,
		});
	},
};