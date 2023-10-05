module.exports = {
	isVoiceConnected: (memberVoiceState) => {
		return !(memberVoiceState === undefined || (memberVoiceState.channelId === null || memberVoiceState.channelId === undefined));
	},
	isVoiceChannelShared: (memberVoiceState, clientVoiceState) => {
		return (memberVoiceState.channelId === clientVoiceState.channelId);
	},
};