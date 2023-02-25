const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect the bot to a voice channel'),
	async execute(interaction) {
		const voiceStates = interaction.guild.voiceStates.cache;
		const authorVoiceState = voiceStates.get(interaction.member.id);
		const botVoiceState = voiceStates.get(interaction.client.user.id);
		const mp = interaction.client.mp;

		if (authorVoiceState == undefined || authorVoiceState.channelId == null) {
			return interaction.reply({
				content: 'You must be in a voice channel to use this function',
				ephemeral: true,
			});
		}

		if ((botVoiceState == undefined || botVoiceState.channelId == null) || !mp.isPlaying()) {
			if (botVoiceState && (authorVoiceState.channelId == botVoiceState.channelId)) {
				return interaction.reply({
					content: 'I am already connected to this voice channel',
					ephemeral: true,
				});
			}
			mp.joinVC(
				authorVoiceState.channelId,
				interaction.guild.id,
				interaction.guild.voiceAdapterCreator,
			);
		}
		else {
			return interaction.reply({
				content: 'Cannot connect to a new voice channel while audio is playing',
				ephemeral: true,
			});
		}
		interaction.reply(`Moving to channel ${authorVoiceState.channel}`)
			.then(() => setTimeout(() => interaction.deleteReply(), 5000))
			.catch(console.error);
	},
};