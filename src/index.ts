import { Client, Intents } from 'discord.js';
const { token } = require('../config.json')
const { downloadAllFree, buyTicket } = require('./rawhandler/index.js');
import initialize from './commands';
import { PrismaClient } from '@prisma/client';
import Handler from './handlers';

const allowedUsers = ['397857749938995201', '345938621137944577']

type createPayload = {
    title: string;
    kakaoid: string;
    cron: string;
    weekly: boolean;
    channel: string;
    role: string;
}

const prisma = new PrismaClient();


const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

const createSeries = async ({ title, kakaoid, cron, weekly, channel, role }: createPayload) => {
    const slug = Handler.toUrl(title);
    const series = await prisma.series.create({
        data: {
            title,
            kakaoId: kakaoid,
            cron,
            weekly,
            role,
            channel,
            slug
        }
    })
    return `The series (Title: ${series.title}) has been created.`
}

client.on('ready', () => {
    console.log('The bot is ready!')
});


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const type = interaction.commandName;
    await interaction.deferReply();
    const user = interaction.member?.user.id!;
    if (!allowedUsers.includes(user)) {
        await interaction.editReply(`You're not allowed to use this shit my man hmmm`)
        return;
    } else {
        switch (type) {
            case 'mass':
                const id = interaction.options.getString('kakaoid')!;
                const chapters = await buyTicket(id);
                await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
                await interaction.editReply('done');
                await interaction.channel?.send('im done bitch')
            default:
                await interaction.editReply('u gae');
                return;
        }
    }

})

client.login(token);
initialize();
