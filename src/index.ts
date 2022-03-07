import { Client, Intents, MessageEmbed } from 'discord.js';
const { token } = require('../config.json')
import { handleTicket as buyTicket, ripLatest, getChapter, getLatestChapter } from './rawhandler'
import fs from 'fs/promises'
import schedule from 'node-schedule'
import { PrismaClient, Series } from '@prisma/client';
const allowedUsers = ['397857749938995201', '345938621137944577', '422790603064213528']
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});




export function toUrl(string: string): string {
    return string.toLowerCase().replaceAll('.', '-').replaceAll(`'`, '').replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, '').replaceAll(' ', '-');
}

const chapter = {
    id: 58566343,
    chapter_number: 1,
    series_id: '58509736',
    free: true,
    title: ''
}

client.on('ready', async () => {
    console.log('The bot is ready!')
    await client.guilds.cache.get('794049571973890068')?.commands.create({
        name: 'getchapter', description: 'Get the specified chapter.', type: 'CHAT_INPUT', options: [
            { name: 'chapternumber', type: 'INTEGER', description: 'Number of the specified chapter', required: true },
            { name: 'kakaoid', type: 'STRING', description: 'KakaoID of the series', required: true },
            { name: 'seriestitle', type: 'STRING', description: 'Title of the series, in the format of a slug', required: true },
        ]
    })

    const test_series = [{ id: '57781183', title: 'archmage-streamer' }, { id: '58800646', title: 'is-this-hero-for-real' }, { id: '57451201', title: 'return-of-the-legendary-spear-knight' }];
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    for (let i = 0; i <= test_series.length - 1; i++) {
        await getLatestChapter(test_series[i].id, test_series[i].title, browser);
    }

});



type SeriesItem = {
    id: string;
    title: string;
}

const thursday_job = schedule.scheduleJob('01 22 * * 4', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'thursday', weekly: true } });
        let ids: SeriesItem[] = [];
        daily_series.forEach(series => ids.push({ id: series.kakaoId, title: series.slug }));
        const files = await ripLatest(ids);
        console.log(daily_series);
        console.log(ids);

        async function handleSeries(series: Series) {
            try {
                const channel = client.channels.cache.get(series.channel);
                if (channel?.isText()) {
                    const file = files.filter(file => file.includes(series.slug))
                    if (file) {
                        await channel.send({ files: [file[0]], content: 'Weekly chapter' })
                        await channel.send(`<@&${series.role}>, <@&946250134042329158>`)
                        await channel.send('Weekly RP done.')
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        await Promise.all(daily_series.map((series) => handleSeries(series)));
    } catch (error) {
        console.log(error);
    }
})

const friday_job = schedule.scheduleJob('01 22 * * 5', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'friday', weekly: true } });
        let ids: SeriesItem[] = [];
        daily_series.forEach(series => ids.push({ id: series.kakaoId, title: series.slug }));
        const files = await ripLatest(ids);
        console.log(daily_series);
        console.log(ids);

        async function handleSeries(series: Series) {
            try {
                const channel = client.channels.cache.get(series.channel);
                if (channel?.isText()) {
                    const file = files.filter(file => file.includes(series.slug))
                    if (file) {
                        await channel.send({ files: [file[0]], content: 'Weekly chapter' })
                        await channel.send(`<@&${series.role}>, <@&946250134042329158>`)
                        await channel.send('Weekly RP done.')
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        await Promise.all(daily_series.map((series) => handleSeries(series)));
    } catch (error) {
        console.log(error);
    }
})

const saturday_job = schedule.scheduleJob('01 22 * * 6', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'saturday', weekly: true } });
        let ids: SeriesItem[] = [];
        daily_series.forEach(series => ids.push({ id: series.kakaoId, title: series.slug }));
        const files = await ripLatest(ids);
        console.log(daily_series);
        console.log(ids);

        async function handleSeries(series: Series) {
            try {
                const channel = client.channels.cache.get(series.channel);
                if (channel?.isText()) {
                    const file = files.filter(file => file.includes(series.slug))
                    if (file) {
                        await channel.send({ files: [file[0]], content: 'Weekly chapter' })
                        await channel.send(`<@&${series.role}>, <@&946250134042329158>`)
                        await channel.send('Weekly RP done.')
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        await Promise.all(daily_series.map((series) => handleSeries(series)));
    } catch (error) {
        console.log(error);
    }
})



client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const type = interaction.commandName;
    await interaction.deferReply();
    const user = interaction.member?.user.id!;
    switch (type) {
        case 'mass':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const id = interaction.options.getString('kakaoid')!;
            const starts_at = interaction.options.getNumber('startsat')!;
            const series_title = interaction.options.getString('title')!;
            const chapters = await buyTicket(id, starts_at, series_title);
            await interaction.editReply('Done.');
            await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
            await Promise.all(chapters.map((chapter: any) => fs.unlink(chapter)));
            await interaction.channel?.send('RP done.')
            await interaction.editReply('Done.');
            return;
        // return;
        case 'add':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
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
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const weekly_status = interaction.options.getBoolean('weekly')!;
            const series_id = interaction.options.getNumber('id')!;
            const exists = await prisma.series.findFirst({ where: { id: series_id } });
            if (exists) {
                await prisma.series.update({ where: { id: series_id }, data: { weekly: weekly_status } });
                await interaction.channel?.send('Series updated.');
            } else await interaction.channel?.send('Series does not exist.')
            await interaction.editReply('Done.');
            return;
        case 'remove':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const removed_id = interaction.options.getString('kakaoid')!;
            await prisma.series.deleteMany({ where: { kakaoId: removed_id } });
            await interaction.editReply('Series removed.');
            return;
        case 'getchapter':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const kakao_series_id = interaction.options.getString('kakaoid')!;
            const chapter_number = interaction.options.getInteger('chapternumber')!;
            const kakao_title = interaction.options.getString('seriestitle')!;
            const specified_file = await getChapter(chapter_number, kakao_series_id, toUrl(kakao_title));
            if (specified_file) {
                await interaction.channel?.send({ files: [specified_file] });
            }
            await interaction.editReply('RP done.');
            return;
        default:
            await interaction.editReply('Done.');
            return;
    }

})



client.login(token);

