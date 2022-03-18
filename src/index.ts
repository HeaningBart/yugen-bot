import { Client, Intents, MessageEmbed } from 'discord.js';
const { token } = require('../config.json')
import { getChapter, getLatestChapter, processNaver, getChaptersList, downloadSRChapter } from './rawhandler'
import { start, logIn, buyTicket } from './rawhandler/kakao'
import fs from 'fs/promises'
import schedule from 'node-schedule'
import { PrismaClient, Series } from '@prisma/client';
const allowedUsers = ['397857749938995201', '345938621137944577', '422790603064213528', '121671582044258306']
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



client.on('ready', async () => {
    console.log('The bot is ready!')
    await client.guilds.cache.get('794049571973890068')?.commands.create({
        name: 'sr',
        description: 'mass rp a series',
        type: 'CHAT_INPUT',
        options: [
            {
                name: 'seriesid',
                description: 'seriesid from the raws',
                type: 'STRING',
                required: true
            },
            {
                name: 'title',
                description: 'series title',
                type: 'STRING',
                required: true
            },
        ]
    })
});



type SeriesItem = {
    id: string;
    title: string;
}

const monday_job = schedule.scheduleJob('01 22 * * 1', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'monday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send('There was an error during the RP process of a series.');
                    await log_channel.send(`Please, get the chapter through /getchapter`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const tuesday_job = schedule.scheduleJob('01 22 * * 2', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'tuesday', weekly: true }, orderBy: { id: 'asc' } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const wednesday_job = schedule.scheduleJob('01 22 * * 3', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'wednesday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const thursday_job = schedule.scheduleJob('01 22 * * 4', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'thursday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const raws_channel = client.channels.cache.get('948666335691436102');
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                        try {
                            if (raws_channel?.isText()) {
                                await raws_channel.send({ files: [file], content: `Weekly chapter of ${series.title}` });
                            }
                        } catch (e) {

                        }
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const friday_job = schedule.scheduleJob('01 22 * * 5', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'friday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const raws_channel = client.channels.cache.get('948666335691436102');
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                        try {
                            if (raws_channel?.isText()) {
                                await raws_channel.send({ files: [file], content: `Weekly chapter of ${series.title}` });
                            }
                        } catch (e) {

                        }
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const saturday_job = schedule.scheduleJob('01 22 * * 6', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'saturday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const raws_channel = client.channels.cache.get('948666335691436102');
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                        try {
                            if (raws_channel?.isText()) {
                                await raws_channel.send({ files: [file], content: `Weekly chapter of ${series.title}` });
                            }
                        } catch (e) {

                        }
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
})

const sunday_job = schedule.scheduleJob('01 22 * * 7', async function () {
    try {
        const daily_series = await prisma.series.findMany({ where: { cron: 'sunday', weekly: true } });
        const browser = await start();
        await logIn(browser);
        for (let i = 0; i <= daily_series.length - 1; i++) {
            try {
                const series = daily_series[i];
                const channel = client.channels.cache.get(series.channel);
                const raws_channel = client.channels.cache.get('948666335691436102');
                const role = series.role;
                if (channel?.isText()) {
                    const file = await getLatestChapter(series.kakaoId, series.slug, browser);
                    if (file) {
                        await channel.send({ files: [file], content: `Weekly chapter of ${series.title}` })
                        await channel.send(`<@&${role}>, <@&946250134042329158>`);
                        await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                        await channel.send('Weekly RP done.');
                        try {
                            if (raws_channel?.isText()) {
                                await raws_channel.send({ files: [file], content: `Weekly chapter of ${series.title}` });
                            }
                        } catch (e) {

                        }
                    }
                }
            } catch (error) {
                console.log(error);
                const log_channel = client.channels.cache.get('948063125486329876');
                if (log_channel?.isText()) {
                    await log_channel.send(`There was an error during the RP process of a series(${daily_series[i].title}).`);
                    await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
                }
            }
        }
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
            // if (!allowedUsers.includes(user)) {
            //     await interaction.editReply(`You're not allowed to use this command.`)
            //     return;
            // }
            // const id = interaction.options.getString('kakaoid')!;
            // const starts_at = interaction.options.getNumber('startsat')!;
            // const series_title = interaction.options.getString('title')!;
            // const chapters = await buyTicket(id, starts_at, series_title);
            // await interaction.editReply('Done.');
            // await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
            // await Promise.all(chapters.map((chapter: any) => fs.unlink(chapter)));
            // await interaction.channel?.send('RP done.')
            // await interaction.editReply('Done.');
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
            const all_series = await prisma.series.findMany({ where: { cron: release_day }, orderBy: { id: 'asc' } });
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
        case 'process':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const download_url = interaction.options.getString('url')!;
            const channel_id = interaction.options.getChannel('channel')!.id;
            const role_id = interaction.options.getRole('role')!.id;
            const processed_file = await processNaver(download_url);
            if (processed_file) {
                const target_channel = client.channels.cache.get(channel_id);
                if (target_channel?.isText()) {
                    await target_channel.send({ files: [processed_file] })
                    await target_channel.send(`<@&${role_id}>, <@&946250134042329158>`);
                    await target_channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
                }
            }
            await interaction.editReply('Done.');
            return;
        case 'sr':
            if (!allowedUsers.includes(user)) {
                await interaction.editReply(`You're not allowed to use this command.`)
                return;
            }
            const series_kakao_id = interaction.options.getString('seriesid')!;
            const series_kakao_title = interaction.options.getString('title')!;
            const chapters = await getChaptersList(series_kakao_id, 'asc');
            const free_chapters = chapters.filter(chapter => chapter.free === true);
            const paid_chapters = chapters.filter(chapter => chapter.free === false);

            const browser = await start();
            // await logIn(browser);

            await interaction.editReply('Starting RP of free chapters');

            const free_files = await Promise.all(free_chapters.map(chapter => downloadSRChapter(chapter, series_kakao_title, browser)));
            if (free_files) await Promise.all(free_files.map((chapter) => {
                if (chapter) {
                    interaction.channel?.send({ files: [chapter] })
                }
            }));

            // await interaction.editReply('Starting purchase of tickets.');


            // for (let i = 0; i <= paid_chapters.length - 1; i++) {
            //     try {
            //         const length = paid_chapters.length - 1;
            //         buyTicket(browser, series_kakao_id);
            //         await interaction.editReply(`Buying tickets... (${i + 1}/${length})`);
            //     } catch (error) {
            //         console.log(error);
            //     }
            // }




            // const chapters = await buyTicket(id, starts_at, series_title);


            // await interaction.editReply('Done.');
            // await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
            // await Promise.all(chapters.map((chapter: any) => fs.unlink(chapter)));
            // await interaction.channel?.send('RP done.')
            await interaction.editReply('Done.');
            return;
        default:
            await interaction.editReply('Done.');
            return;
    }

})



client.login(token);

