const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prev')
		.setDescription('Play the previous track in the queue'),
	voiceChannelRequired: true,
	async execute(interaction) {
		const mp = interaction.client.mp;
		const pos = mp.playlist.readHead;

		if (pos == 0) {
			return interaction.reply({
				content: 'Already at the beginning of the play queue',
				ephermal: true,
			});
		}
		const doesExist = mp.playTrack(pos - 1);
		if (!doesExist) {
			return interaction.reply({
				content: 'An unknown error has occurred.\nPlease try again later.',
				ephemeral: true,
			});
		}
		return interaction.reply('Playing previous track')
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};