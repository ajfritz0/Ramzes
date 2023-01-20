const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause playing audio'),
	async execute(interaction) {
		const mpCollection = interaction.client.MusicPlayerCollection;
		const mp = mpCollection.get(interaction.guild.id);
		if (mp === null || mp === undefined) return interaction.reply('You have not added music');

		mp.togglePause();
		interaction.reply('Paused playback');
		setTimeout(() => interaction.deleteReply(), 10 * 1000);
	},
};