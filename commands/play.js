const { SlashCommandBuilder } = require('discord.js');
const ytsr = require('ytsr');
const { isVoiceChannelShared, isVoiceConnected } = require('../src/lib/validateMemberVoiceState');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play youtube audio')
		.addSubcommand(subcommand =>
			subcommand
				.setName('link')
				.setDescription('Play audio via youtube url')
				.addStringOption(option =>
					option
						.setName('url')
						.setDescription('URL')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('search')
				.setDescription('Add audio via search')
				.addStringOption(option =>
					option
						.setName('query')
						.setDescription('Search Query')
						.setRequired(true),
				).addIntegerOption(option =>
					option
						.setName('id')
						.setDescription('The ID of the video to add'),
				),
		),
	voiceChannelRequired: false,
	async execute(interaction) {
		const voiceStates = interaction.guild.voiceStates.cache;
		const authorVoiceState = voiceStates.get(interaction.member.id);
		const clientVoiceState = voiceStates.get(interaction.client.user.id);
		const mp = interaction.client.mp;
		const subCommand = interaction.options.getSubcommand();

		if (!isVoiceConnected(authorVoiceState)) return 'You must be in a voice channel to use this command';
		if (!isVoiceConnected(clientVoiceState)) {
			if (authorVoiceState.channel.full) return 'Unable to join: voice channel is full';
			mp.joinVC(
				authorVoiceState.channelId,
				interaction.guild.id,
				interaction.guild.voiceAdapterCreator,
			);
		}
		else if (!isVoiceChannelShared(authorVoiceState, clientVoiceState)) {
			return 'Unable to play: We must be in the same voice channel';
		}

		const url = interaction.options.getString('url');
		const query = interaction.options.getString('query');
		const id = interaction.options.getInteger('id');

		if (subCommand == 'link') {
			const index = await mp.add(url, false);
			if (index == -1) {
				return 'An unknown error has occurred.\nPlease try again later.';
			}
			// once the track(s) are added, Play added tracks
			mp.playTrack(index);
		}
		else {
			const searchResults = await ytsr(query, {
				limit: 20,
			});
			const filteredResults = searchResults.items.filter(value => {
				if (value.type != 'video' || value?.isLive) return false;
				return true;
			}).slice(0, 10);

			if (id && (id < 1 || id > 10)) {
				return 'The id provided is out of range';
			}
			const trackSelected = (id) ? id - 1 : 0;
			const index = await mp.add(filteredResults[trackSelected].url, false);

			if (index == -1) {
				return 'An unknown error has occurred.\nPlease try again later.';
			}
			mp.playTrack(index);
		}
		return 'Playing';
	},
};