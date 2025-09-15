import { REST, Routes, SlashCommandBuilder } from "discord.js";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.DISCORD_TOKEN;


const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Responde com Pong!"),

    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Diz olá")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 Registrando comandos...");
        await rest.put(
            Routes.applicationCommands(APP_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error(error);
    }
})();
