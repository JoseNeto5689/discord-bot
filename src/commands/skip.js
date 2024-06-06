
const { useQueue } = require('discord-player')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
module.exports = {
data: new SlashCommandBuilder()
	.setName('skip')
	.setDescription('If you are the requester, skip the current song'),

execute: async function (interaction) {
	try {
		const channel = interaction.member.voice.channel;
		const queue = useQueue(interaction.guild.id)
		if (!channel) {
			return interaction.reply({
				content: 'You are not in a voice channel!',
				ephemeral: true,
			});
		}
		if (!queue.currentTrack) {
			return interaction.reply({
				content: 'There is no song playing!',
				ephemeral: true,
			});
		}
		// check if the user is in the same channel as the bot
		if (channel !== queue.channel) {
			return interaction.reply({
				content: 'You are not in the same channel as the bot!',
				ephemeral: true,
			});
		}
		queue.node.skip();

		return await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(0xffff00)
					.setDescription(`Skipped in ${channel.name}`),
			],
	})

} catch (error) {
	console.error(error);
	await interaction.reply('An error occurred while processing this command');
}}}
