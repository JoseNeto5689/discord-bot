
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js")

const row = new ActionRowBuilder()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("select")
            .setPlaceholder("Choose a music streaming service")
            .addOptions(
                {
                    label: "Spotify",
                    description: "Spotify songs here",
                    value: "spotifySearch"
                },
                {
                    label: "YouTube Music",
                    description: "YouTube Music search songs",
                    value: "ytmusic"
                },
                {
                    label: "YouTube Videos",
                    description: "YouTube Videos (not necessarily music)",
                    value: "youtubeSearch"
                }
            )
    )

module.exports = {
    data: new SlashCommandBuilder()
        .setName("select")
        .setDescription("Choose a music streaming service"),

    async execute(interaction) {
        await interaction.reply({content: "Choose a music streaming service", components: [row]})
    },

    async executeMenuOption(interaction, client){
        const selected = interaction.values[0]
        client.streaming = selected

        const response = selected === "spotifySearch" ? "Spotify" : selected === "ytmusic" ? "YouTube Music" : "YouTube Videos"
        await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(0x008000)
					.setDescription(response + " selected"),
			],
		})
    }
}
