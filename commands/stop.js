const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops currently playing audio'),
	async execute(interaction) {
		const mp = interaction.client.MusicPlayerCollection.get(interaction.guild.id);
		if (mp === null || mp === undefined) return interaction.reply('You have not added any music');
		mp.stop();
		await interaction.reply('Stopped');
		setTimeout(() => interaction.deleteReply(), 10 * 1000);
	},
};