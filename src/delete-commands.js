const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.TOKEN);

console.log('Deletando todos os comandos...')
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
	.then(() => console.log('Todos os comandos foram deletados!'))
	.catch(console.error);