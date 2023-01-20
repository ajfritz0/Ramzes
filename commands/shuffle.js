const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the playlist queue'),
	async execute(interaction) {
		const mp = interaction.client.MusicPlayerCollection.get(interaction.guild.id);
		if (mp === null || mp === undefined) return interaction.reply('You have not added any music');

		mp.shuffle();
		return interaction.reply('Music Shuffled').then((() => {
			setTimeout(() => interaction.deleteReply(), 10 * 1000);
		}));
	},
};