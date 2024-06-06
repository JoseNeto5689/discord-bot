const { useMainPlayer, useQueue } = require('discord-player')
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')

module.exports = {
data: new SlashCommandBuilder()
	.setName('search')
	.setDescription('Search results for a song, and select one to play')
	.addStringOption(option =>
		option.setName('query')
			.setDescription('The song you want to play')
			.setRequired(true))
	.addIntegerOption(option =>
		option.setName('position')
			.setDescription('this num is from 0, negative numbers will be treated from the end')
			.setRequired(false)),

execute: async function (interaction, client) {
	const player = useMainPlayer();
	const channel = interaction.member.voice.channel;
	if (!channel) {
		return interaction.reply({
			content: 'You are not in a voice channel!',
			ephemeral: true,
		});
	}
	if (!channel.joinable) {
		return interaction.reply({
			content: 'I cannot join your voice channel!',
			ephemeral: true,
		});
	}

	const queue = useQueue(interaction.guild.id);
	if (queue && queue.channel !== channel) {
		return interaction.reply({
			content: 'I am already playing in another channel!',
			ephemeral: true,
		});
	}

	const query = interaction.options.getString('query', true);

	let search = client.streaming == "ytmusic" || client.streaming == "youtube" ? query + " music" : query

	const searchResult = await player.search(search, {
		requestedBy: interaction.user,
		searchEngine: client.streaming == "ytmusic" ? "youtube" : client.streaming
	});

		try {

			const list = []
			searchResult.tracks.forEach((track, index) => {
				list.push({
					label:  track.title.length > 100 ? track.title.slice(0, 97) + "..." : track.title,
					description: track.author + " - " + track.duration,
					value: track.url
				});
			});

			const row = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("search")
					.setPlaceholder("Select one music")
					.addOptions(
						...list
					)
			)

			await interaction.reply({content: "Results for " + query, components: [row]})
			
			
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: 'There was an error trying to execute that command!\n' + error,
			});
		}
},

async executeMenuOption(interaction, client){
	const player = useMainPlayer();
	const channel = interaction.member.voice.channel;
	if (!channel) {
		return interaction.reply({
			content: 'You are not in a voice channel!',
			ephemeral: true,
		});
	}
	if (!channel.joinable) {
		return interaction.reply({
			content: 'I cannot join your voice channel!',
			ephemeral: true,
		});
	}
	const queue = useQueue(interaction.guild.id);
	if (queue && queue.channel !== channel) {
		return interaction.reply({
			content: 'I am already playing in another channel!',
			ephemeral: true,
		});
	}

	let query = interaction.values[0]
	const searchResult = await player.search(query, {
		requestedBy: interaction.user,
		searchEngine: client.streaming
	});
	/*if (!searchResult?.tracks.length) {
		return interaction.editReply(`No results were found for your query ${query}!`);
	}*/
	//else {
		try {
			await interaction.deferReply();
			const track = searchResult.tracks[0];
			let position = 0;
			const queue = useQueue(interaction.guild.id);
			if (queue && position !== undefined && position !== null && position !== -1 && position !== queue.tracks.length - 1) {
				if (position > queue.tracks.length - 1 || position < -queue.tracks.length + 1) {
					return interaction.editReply(`Invalid position ${position}!`);
				}
				else if (position < 0) {
					position = queue.tracks.length + position;
				}
				queue.addTrack(track, position)
			}
			else {
				client.lastChannel = channel
				client.nodeOptions = {
					nodeOptions: {
						metadata: {
							channel: interaction.channel,
							client: interaction.guild.members.me,
							requestedBy: interaction.user,
						},
						leaveOnEmpty: true,
						leaveOnEmptyCooldown: 60000,
						leaveOnEnd: true,
						leaveOnEndCooldown: 300000,
					},
				}
				await player.play(channel, track, client.nodeOptions);
			}
			return await interaction.editReply(`🎶 | Track **${searchResult.tracks[0].title}** queued!`);
		} catch (error) {
			if(client.autoplay){
				queue.node.skip();
			}
			console.error(error);
			await interaction.editReply({
				content: 'There was an error trying to execute that command!\n' + error,
			});
		}
}



}
