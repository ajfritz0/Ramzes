const { SlashCommandBuilder } = require('discord.js');
const ytsr = require('ytsr');

// when playing a url, it shoudl add the track to the queue in place, rather than at the end
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
	async execute(interaction) {
		// first check if the bot is in a voice channel
		// if not, join the voice channel associated with the user's interaction
		const voiceStates = interaction.guild.voiceStates.cache;
		const author = interaction.member.id;
		const authorVoiceState = voiceStates.get(author);
		const botVoiceState = voiceStates.get(interaction.client.user.id);
		const mp = interaction.client.mp;
		const subCommand = interaction.options.getSubcommand();

		const url = interaction.options.getString('url');
		const query = interaction.options.getString('query');
		const id = interaction.options.getInteger('id');

		await interaction.deferReply();
		// I want to rework this section as well as the validate file
		if (authorVoiceState === undefined || authorVoiceState.channelId === null) {
			return interaction.editReply({
				content: 'You must be in a voice channel to use this function',
				ephemeral: true,
			});
		}
		if (botVoiceState === undefined || botVoiceState.channelId === null) {
			mp.joinVC(
				authorVoiceState.channelId,
				interaction.guild.id,
				interaction.guild.voiceAdapterCreator,
			);
		}
		else if (botVoiceState.channelId !== authorVoiceState.channelId) {
			return interaction.editReply({
				content: 'You are not in the correct voice channel',
				ephemeral: true,
			});
		}

		// eventually make this dynamic, so the text channnel changes
		// when commands are made from other text channels
		if (interaction.channel.type == 'GUILD_VOICE') mp.textChannel = interaction.guild.systemChannel;
		else mp.textChannel = interaction.channel;

		if (subCommand == 'link') {
			const index = await mp.add(url, false);
			if (index == -1) {
				return interaction.editReply({
					content: 'An unknown error has occurred.\nPlease try again later.',
					ephemeral: true,
				});
			}
			// once the track(s) are added, Play added tracks
			mp.playTrack(index);
			return interaction.editReply('Playing Audio')
				.then(() => setTimeout(() => interaction.deleteReply(), 5000))
				.catch(console.error);
		}
		else {
			try {
				const searchResults = await ytsr(query, {
					limit: 20,
				});
				const filteredResults = searchResults.items.filter(value => {
					if (value.type != 'video' || value?.isLive) return false;
					return true;
				}).slice(0, 10);

				if (id && (id < 1 || id > 10)) {
					return interaction.editReply({
						content: 'The id provided is out of range',
						ephemeral: true,
					});
				}
				const trackSelected = (id) ? id - 1 : 0;
				const index = await mp.add(filteredResults[trackSelected].url, false);
				if (index == -1) {
					return interaction.editReply({
						content: 'An unknown error has occurred.\nPlease try again later.',
						ephemeral: true,
					});
				}
				mp.playTrack(index);
				return interaction.editReply('Playing Audio')
					.then(() => setTimeout(() => interaction.deleteReply(), 5000))
					.catch(console.error);
			}
			catch (error) {
				console.error(error);
				return interaction.editReply({
					content: 'An uknown error has occurred.\nPlease try again later.',
					ephemeral: true,
				});
			}
		}
	},
};