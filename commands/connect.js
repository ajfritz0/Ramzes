const { SlashCommandBuilder } = require('discord.js');
const { isVoiceConnected, isVoiceChannelShared } = require('../src/lib/validateMemberVoiceState');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect the bot to a voice channel'),
	voiceChannelRequired: false,
	async execute(interaction) {
		const voiceStates = interaction.guild.voiceStates.cache;
		const authorVoiceState = voiceStates.get(interaction.member.id);
		const botVoiceState = voiceStates.get(interaction.client.user.id);
		const mp = interaction.client.mp;

		if (!isVoiceConnected(authorVoiceState)) {
			return 'You must be in a voice channel to use this function';
		}

		else if (!isVoiceConnected(botVoiceState) || !isVoiceChannelShared(authorVoiceState, botVoiceState)) {
			if (authorVoiceState.channel.full) return 'Unable to join: voice channel is full';
			mp.joinVC(
				authorVoiceState.channelId,
				interaction.guild.id,
				interaction.guild.voiceAdapterCreator,
			);
			return `Moving to channel ${authorVoiceState.channel.name}`;
		}

		else {
			return 'I am already connected to this voice channel';
		}
	},
};