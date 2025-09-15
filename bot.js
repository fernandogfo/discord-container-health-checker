import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from "discord.js";
import Docker from "dockerode";

// ⚙️ Configurações via ENV
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CATEGORY_NAME = process.env.CATEGORY_NAME || "Status dos Servidores";
const CONTAINERS = process.env.CONTAINERS ? process.env.CONTAINERS.split(",") : [];

if (!DISCORD_TOKEN || !GUILD_ID || CONTAINERS.length === 0) {
    console.error("❌ Verifique se DISCORD_TOKEN, GUILD_ID e CONTAINERS estão definidos no ENV.");
    process.exit(1);
}

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

function statusToEmoji(status) {
    if (status === "running") return "🟢";
    if (status === "exited") return "🔴";
    if (status === "restarting" || status === "created") return "🟡";
    return "⚪";
}

async function updateChannels() {
    const guild = await client.guilds.fetch(GUILD_ID);

    // ⚙️ Permissões da categoria
    const everyoneRole = guild.roles.everyone;

    let category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME
    );

    if (!category) {
        category = await guild.channels.create({
            name: CATEGORY_NAME,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ViewChannel,
                    ],
                },
            ],
        });
        console.log(`📂 Categoria criada: ${CATEGORY_NAME}`);
    }

    for (const containerName of CONTAINERS) {
        try {
            const container = docker.getContainer(containerName);
            const info = await container.inspect();
            const status = info.State.Status;
            const emoji = statusToEmoji(status);
            const channelName = `${containerName} - ${emoji}`;

            // Verifica se o canal já existe
            let channel = guild.channels.cache.find(
                (c) => c.parentId === category.id && c.name.includes(containerName)
            );

            const overwrites = [
                {
                    id: everyoneRole.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ViewChannel,
                    ],
                },
            ];

            if (!channel) {
                channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: overwrites,
                });
                console.log(`📌 Canal criado: ${channelName}`);
            } else if (channel.name !== channelName) {
                await channel.setName(channelName);
            }
        } catch (err) {
            console.error(`Erro ao consultar container ${containerName}:`, err.message);
        }
    }
}

// Atualiza a cada 30s
setInterval(() => {
    updateChannels().catch(console.error);
}, 30000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    updateChannels();
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
        await interaction.reply("🏓 Pong!");
    } else if (interaction.commandName === "hello") {
        await interaction.reply("👋 Olá, dev!");
    }
});

client.login(DISCORD_TOKEN);

