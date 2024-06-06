const { Client, Events, GatewayIntentBits, Collection, ActivityType, EmbedBuilder, escapeMarkdown } = require('discord.js')
const { Player, QueueRepeatMode } = require("discord-player")
const puppeteer = require("puppeteer");

//https://github.com/emresenyuva/youtube-music-api/commit/b52b2b0d3fd146face64d193ba333c948e857451

const dotenv = require('dotenv')
dotenv.config()
const { TOKEN } = process.env

const fs = require("node:fs")
const path = require("node:path")
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] })

client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25,
    }
})

client.track = null

client.autoPlayState = false

client.lastChannel = null

client.nodeOptions = {}

client.streaming = "youtube"

client.player.events.on("disconnect", (queue) => {
    queue.delete()
    client.track = null

    client.autoPlayState = false

    client.lastChannel = null

    client.nodeOptions = {}

    client.streaming = "youtube"

})

client.player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send({ embeds: [
      new EmbedBuilder({
        title: 'Started Playing',
        description: `[${ escapeMarkdown(track.title) }](${ track.url })`,
        thumbnail: { url: track.thumbnail, height: 100, width: 100},
        footer: { text: `${ track.duration } - by ${ track.author }\n` }
      })
    ] });
  });

//Implementar para varios canais caso precise
client.player.events.on("playerStart", async (queue, track) => {
    if(client.autoPlayState){
        if(track.raw.source == "youtube"){
            queue.setRepeatMode(QueueRepeatMode.OFF)
        }else {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)
        }
    }else {
        queue.setRepeatMode(QueueRepeatMode.OFF)
    }
    client.track = track
})

client.player.events.on("playerError", async () => {
    const query = client.track.title

    const searchResult = await client.player.search(query, {
        requestedBy: "bot"
    });

    const track = searchResult.tracks[1];


    await client.player.play(client.lastChannel, track)
    


})

client.player.events.on("playerFinish", async (queue) => {

    if(client.autoPlayState && (client.track.raw.source == "youtube") && queue.tracks.data.length === 0){
        const baseUrl = "https://music.youtube.com/watch?v=" + client.track.raw.id;
        let browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        });
        const [page] = await browser.pages();
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
        await page.setUserAgent(ua);
        await page.goto(baseUrl, {waitUntil: "domcontentloaded"});
        
        const element = await page.waitForSelector("#yDmH0d > c-wiz > div > div > div > div.v2Yske > div.CqMh6b > div.qqtRac > div.KZ9vpc > form:nth-child(3) > div > div > button > div.VfPpkd-RLmnJb")

        await element.evaluate(b => b.click())
        /*
        const button = await page.waitForSelector("#tabsContent > tp-yt-paper-tab:nth-child(4)")

        await button.evaluate(b => b.click())

        const link = await page.waitForSelector("#items > ytmusic-responsive-list-item-renderer:nth-child(1) > div.flex-columns.style-scope.ytmusic-responsive-list-item-renderer > div.title-column.style-scope.ytmusic-responsive-list-item-renderer > yt-formatted-string > a")

        const fullTitle = await link?.evaluate(el => el.href);

        */

        const button = await page.waitForSelector("#automix-contents > ytmusic-player-queue-item:nth-child(1) #play-button > div > yt-icon")

        await Promise.all([
            button.evaluate(el => el.click())
        ])

        let fullTitle = await page.url();

        await browser.close();

        fullTitle = fullTitle.split("&list=")[0]

        const searchResult = await client.player.search(fullTitle, {
            requestedBy: "bot",
            searchEngine: "auto"
        });

        const track = searchResult.tracks[0];

        await client.player.play(client.lastChannel, track)
    }

})


client.player.extractors.loadDefault()

client.commands = new Collection()

for (const file of commandFiles){
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command)
    } else  {
        console.log(`Esse comando em ${filePath} está com "data" ou "execute ausentes"`)
    } 
}


client.once(Events.ClientReady, c => {
	console.log(`Pronto! Login realizado como ${c.user.tag}`)
    client.user.setActivity('/play', { type: ActivityType.Listening });
});
client.login(TOKEN)


client.on(Events.InteractionCreate, async interaction =>{
    if (interaction.isStringSelectMenu()){
        const commandName = interaction.customId
        const command = interaction.client.commands.get(commandName)
        if (!command) {
            console.error("Comando não encontrado")
            return
        }
        try {
            await command.executeMenuOption(interaction, client)
        } 
        catch (error) {
            console.error(error)
            await interaction.reply("Houve um erro ao executar esse comando!")
        }
        return 
    }
    if (!interaction.isChatInputCommand()) return
    const command = interaction.client.commands.get(interaction.commandName)
    if (!command) {
        console.error("Comando não encontrado")
        return
    }
    try {
        await command.execute(interaction, client)
    } 
    catch (error) {
        console.error(error)
        await interaction.reply("Houve um erro ao executar esse comando!")
    }
})

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('...')
})

app.listen(port, () => {
  console.log(`Discord bot working in port ${port}`)
})
