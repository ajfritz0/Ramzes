module.exports = (interaction) => {
	// validate whether the member issuing the command is in the correct voice channel
	const voiceStates = interaction.guild.voiceStates.cache;
	const memberVoiceState = voiceStates.get(interaction.member.id);
	const botVoiceState = voiceStates.get(interaction.client.user.id);
	if (memberVoiceState === undefined || memberVoiceState.channelId === null) {
		interaction.reply({ content: 'You must be in a voice channel to use this function', ephemeral: true });
		return false;
	}
	// detect whether the bot is connected to a voice channel
	if (botVoiceState === undefined || botVoiceState.channelId === null) {
		interaction.reply({ content: 'I am currently not connected to a voice channel', ephemeral: true });
		return false;
	}

	if (botVoiceState.channelId !== memberVoiceState.channelId) {
		interaction.reply({ content: 'You are not in the correct voice channel', ephemeral: true });
		return false;
	}
	return true;

	// future: check role permissions
};