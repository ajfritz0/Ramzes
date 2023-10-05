module.exports = (oldState, newState) => {
	const client = newState.client;
	const clientId = client.user.id;
	const clientVoiceState = newState.guild.voiceStates.cache.get(clientId);
	if (clientVoiceState === undefined || !clientVoiceState.channelId) return;

	if (oldState.id === clientId && newState.id === clientId && oldState.mute === false && newState.mute === true) {
		return client.mp.startLonelyTimer();
	}
	const voiceChannelMembers = clientVoiceState.channel.members;
	for (const [memberId] of voiceChannelMembers) {
		if (memberId === clientId) continue;
		if (!clientVoiceState.mute) client.mp.stopLonelyTimer();
		return;
	}

	if (client.mp.lonelyTimer === null) client.mp.startLonelyTimer();
};