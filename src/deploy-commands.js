import { REST, Routes } from "discord.js"

// dotenv
const dotenv = require('dotenv')
dotenv.config()
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env

// importação dos comandos
import fs from "node:fs"
import path from "node:path"
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))

const commands = []

for (const file of commandFiles) { 
   const command = require(`./commands/${file}`)
   commands.push(command.data.toJSON())
}

const rest = new REST({version: "10"}).setToken(TOKEN);

(async () => {
    try {
        console.log(`Resentando ${commands.length} comandos...`)
    
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {body: commands}
        )
            console.log("Comandos registrados com sucesso!")
    }
    catch (error){
        console.error(error)
    }
})()