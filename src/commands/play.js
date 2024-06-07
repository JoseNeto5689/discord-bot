const { useMainPlayer, useQueue } = require('discord-player')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
//const YoutubeMusicApi = require('youtube-music-api')

const puppeteer = require("puppeteer"); // ^22.6.0

const baseUrl = "https://music.youtube.com/search?q="

function isValidURLTest(url) {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlPattern.test(url);
}

module.exports = {
data: new SlashCommandBuilder()
	.setName('play')
	.setDescription('Play a song in your channel!')
	.addStringOption(option =>
		option.setName('query')
			.setDescription('The song you want to play')
			.setRequired(true))
	.addIntegerOption(option =>
		option.setName('position')
			.setDescription('this num is from 0, negative numbers will be treated from the end')
			.setRequired(false)),

 execute: async function (interaction, client) {
	client.autoPlayState = true
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
	// check if the bot has already joined another channel in this guild
	const queue = useQueue(interaction.guild.id);
	if (queue && queue.channel !== channel) {
		return interaction.reply({
			content: 'I am already playing in another channel!',
			ephemeral: true,
		});
	}

	let query = interaction.options.getString('query', true);

	const isValidURL = isValidURLTest(query)

	await interaction.deferReply()
	if (!isValidURL && client.streaming === "ytmusic") {
		const baseUrl = "https://music.youtube.com/search?q=" + query

		let browser;
		browser = await puppeteer.launch();
		const [page] = await browser.pages();
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
		await page.setUserAgent(ua);
		await page.goto(baseUrl, {waitUntil: "domcontentloaded"});
		
		const element = await page.waitForSelector("#yDmH0d > c-wiz > div > div > div > div.v2Yske > div.CqMh6b > div.qqtRac > div.KZ9vpc > form:nth-child(3) > div > div > button > div.VfPpkd-RLmnJb")
        await element.evaluate(b => b.click())
		
		let pos = 1

		while(true) {
			const text = await page.waitForSelector("#chips > ytmusic-chip-cloud-chip-renderer:nth-child(" + pos +") > div > a > yt-formatted-string")
			const textContent = await text?.evaluate(el => el.innerText);
			if(textContent === "Músicas" || textContent === "Música" || textContent === "Musics" || textContent === "Songs") {
				break
			}
			pos++
		}

		await Promise.all([
			page.waitForNavigation(),
			page.click('#chips > ytmusic-chip-cloud-chip-renderer:nth-child('+ pos +') > div')
		])

		const link = await page.waitForSelector("#contents > ytmusic-responsive-list-item-renderer:nth-child(1) > div.flex-columns.style-scope.ytmusic-responsive-list-item-renderer > div.title-column.style-scope.ytmusic-responsive-list-item-renderer > yt-formatted-string > a")

		const fullLink = await link?.evaluate(el => el.href);

		query = fullLink


		await browser.close();

	}

	const searchResult = await player.search(query, {
		requestedBy: interaction.user,
		searchEngine:  !isValidURL ? client.streaming == "ytmusic" ? "auto" : client.streaming : "auto"
	});
	/*if (!searchResult?.tracks.length) {
		return interaction.editReply(`No results were found for your query ${query}!`);
	}*/
	//else {
		try {
			const track = searchResult.tracks[0];
			let position = interaction.options.getInteger('location', false);
			const queue = useQueue(interaction.guild.id);
			if (queue && position !== undefined && position !== null && position !== -1 && position !== queue.tracks.length - 1) {
				if (position > queue.tracks.length - 1 || position < -queue.tracks.length + 1) {
					return interaction.editReply(`Invalid position ${position}!`);
				}
				else if (position < 0) {
					position = queue.tracks.length + position;
				}
				queue.add(track, position);
			}
			else {
				client.lastChannel = channel
				client.nodeOptions = {
					nodeOptions: {
						skipOnNoStream: true,
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
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0x008000)
						.setDescription(`🎶 | Track **${searchResult.tracks[0].title}** queued!`),
				],
			})
		} catch (error) {
			if(client.autoplay){
				queue.node.skip();
			}
			console.error(error);
			await interaction.editReply({
				content: 'There was an error trying to execute that command!\n' + error,
			});
		}
	//}
}}