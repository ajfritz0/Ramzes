// eslint-disable-next-line no-unused-vars
const { CommandInteraction, PermissionsBitField } = require('discord.js');
const { isVoiceConnected, isVoiceChannelShared } = require('../lib/validateMemberVoiceState');
const Logger = require('../lib/Logger');

function validateVoiceStatus(author, client) {
	if (!isVoiceConnected(author)) return 'You must be connected to a voice channel';
	if (!isVoiceConnected(client)) return 'I am not connected to a voice channel';
	if (!isVoiceChannelShared(author, client)) return 'We are currently not in the same voice channel';
	return '';
}

/**
 * @param {CommandInteraction} interaction
 */
module.exports = async (interaction) => {
	if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	const client = interaction.client;
	await interaction.deferReply();

	// Log the interaction
	Logger.info(`Interaction\n\tCommand: ${interaction.commandName} / User: ${interaction.user.username}`
		+ `\n\tChannel: ${interaction.channel.name} / Guild: ${interaction.guild.name}`);

	// does the user of authorization to use these commands
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.UseSoundboard)) {
		return interaction.editReply({
			content: 'You require soundboard permissions to use my commands',
			ephemeral: true,
		});
	}

	const start = (new Date()).getTime();
	const voiceStates = interaction.guild.voiceStates.cache;
	const memberVS = voiceStates.get(interaction.user.id), clientVS = voiceStates.get(client.user.id);

	const status = validateVoiceStatus(memberVS, clientVS);
	if (command.voiceChannelRequired && status !== '') {
		interaction.editReply(status);
	}
	else {
		try {
			const msg = await command.execute(interaction);
			if (typeof msg == 'string' || (typeof msg === 'object' && msg !== null)) {
				interaction.editReply(msg);
			}
			else {
				throw new Error('Messaged not replied');
			}
		}
		catch (error) {
			if (!interaction.replied) interaction.editReply('An Error has occurred.\n```' + error.message + '\n```');
			Logger.error(error);
		}
	}
	Logger.info(`Execution finished in ${(new Date()).getTime() - start}ms!`);
};