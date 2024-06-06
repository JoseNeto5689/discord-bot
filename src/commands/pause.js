
const { useQueue } = require('discord-player')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {

data: new SlashCommandBuilder()
	.setName('pause')
	.setDescription('If you are the requester, pause/resume the current song'),

execute: async function (interaction) {
	const channel = interaction.member.voice.channel;
	if (!channel) {
		return interaction.reply({
			content: 'You are not in a voice channel!',
			ephemeral: true,
		});
	}
	const queue = useQueue(interaction.guild.id);
	if (queue.channel !== channel) {
		return interaction.reply({
			content: 'You are not in the same channel as the bot!',
			ephemeral: true,
		});
	}
	queue.node.setPaused(!queue.node.isPaused());
	if (queue.node.isPaused()) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(0x008000)
					.setDescription(`Paused in ${channel.name}`),
			],
		});
	}
	else {
		await interaction.reply(`Resumed in ${channel.name}`);
	}

}}
