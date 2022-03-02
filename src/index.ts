import { Client, Intents, MessageEmbed } from 'discord.js';
const { token } = require('../config.json')
const { buyTicket, ripLatest } = require('./rawhandler/index.js');
import initialize from './commands';
import Handler from './handlers';
import fs from 'fs/promises'
import schedule from 'node-schedule'
import { PrismaClient, Series } from '@prisma/client';
const allowedUsers = ['397857749938995201', '345938621137944577', '422790603064213528']

const prisma = new PrismaClient();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});


function toUrl(string: string): string {
    return string.toLowerCase().replaceAll('.', '-').replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, '').replaceAll(' ', '-');
}

client.on('ready', () => {
    console.log('The bot is ready!')
});


const handleSeries = async (series: Series) => {
    const channel = client.channels.cache.get(series.channel);
    if (channel?.isText()) {
        await channel.send('Testing weekly raws.');
    }
}

const job = schedule.scheduleJob('21 1 * * 2', async function () {
    const tuesday_series = await prisma.series.findMany({ where: { cron: 'tuesday' } });
    if (tuesday_series) {
        await Promise.all(tuesday_series.map((series) => handleSeries(series)));
    }
})


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const type = interaction.commandName;
    await interaction.deferReply();
    const user = interaction.member?.user.id!;
    if (!allowedUsers.includes(user)) {
        await interaction.editReply(`You're not allowed to use this command.`)
        return;
    } else {
        switch (type) {
            case 'mass':
                const id = interaction.options.getString('kakaoid')!;
                const starts_at = interaction.options.getNumber('startsat')!;
                const chapters = await buyTicket(id, starts_at);
                await interaction.editReply('Done.');
                await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
                await Promise.all(chapters.map((chapter: any) => fs.unlink(chapter)));
                await interaction.channel?.send('RP done.')
                return;
            case 'add':
                const role = interaction.options.getRole('role')!;
                const channel = interaction.options.getChannel('channel')!;
                const weekly = interaction.options.getBoolean('weekly')!;
                const kakaoid = interaction.options.getString('kakaoid')!;
                const title = interaction.options.getString('title')!;
                const cron = interaction.options.getString('cron')!;
                const slug = toUrl(title);
                const series = await prisma.series.create({ data: { role: role.id, channel: channel.id, weekly, kakaoId: kakaoid, title, cron, slug } })
                await interaction.editReply('Series added to the database.')
                await interaction.channel?.send(`Series Title: ${series.title}, Release day: ${series.cron}, Role to be pinged: <@&${series.role}>, Channel: <#${series.channel}>`);
                return;
            case 'getseries':
                const release_day = interaction.options.getString('releaseday')!;
                const all_series = await prisma.series.findMany({ where: { cron: release_day } });
                let embeds: any = [];
                all_series.map((series) => {
                    let embed = new MessageEmbed()
                        .setTitle(series.title)
                        .addField('Weekly', series.weekly.toString(), true)
                        .addField('Slug', series.slug, true)
                        .addField('ID', series.id.toString(), true)
                        .addField('Release Day', series.cron, true)
                        .addField('Role to be pinged', `<@&${series.role}>`, true)
                        .addField('Channel for the message to be sent', `<#${series.channel}>`, true)

                    embeds.push(embed);
                })
                if (embeds.length > 0) await interaction.channel?.send({ embeds })
                else await interaction.channel?.send('No series found.')
                await interaction.editReply('Done.');
                return;
            case 'edit':
                const weekly_status = interaction.options.getBoolean('weekly')!;
                const series_id = interaction.options.getNumber('id')!;
                const exists = await prisma.series.findFirst({ where: { id: series_id } });
                if (exists) {
                    await prisma.series.update({ where: { id: series_id }, data: { weekly: weekly_status } });
                    await interaction.channel?.send('Series updated.');
                } else await interaction.channel?.send('Series does not exist.')
                await interaction.editReply('Done.');
                return;
            case 'latest':
                const kakao_id = interaction.options.getString('kakaoid')!;
                const number = interaction.options.getNumber('startsat');
                const day_series = await prisma.series.findMany({ where: { cron: 'tuesday' } });
                console.log(day_series);
                return;
            default:
                await interaction.editReply('Done.');
                return;
        }
    }

})



client.login(token);
initialize();
