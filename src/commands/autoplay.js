const { QueueRepeatMode, useMainPlayer } = require('discord-player')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
	.setName('autoplay')
	.setDescription('Automatic choose the next song for you!'),

    async execute(interaction, client){
        try {
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guildId);
            if(!queue || !queue.node.isPlaying()) return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xffff00)
                            .setDescription(`**No playlist to set autoplay**`),
                    ],
            })
            
            await interaction.deferReply();
            const action = (queue.repeatMode === QueueRepeatMode.AUTOPLAY) ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY
            queue.setRepeatMode(action)

            client.autoPlayState = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? true : false;

            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x008000)
                        .setDescription(`Autoplay ${client.autoPlayState === false ? "Disabled" : "Enabled"}! ✅`),
                ],
            })
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while processing this command');
        }
    }
}