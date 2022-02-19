import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9';
const { token, clientID } = require('../../config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replis with pong!'),
    new SlashCommandBuilder()
        .setName('get')
        .setDescription('Get the raws from a public chapter').addStringOption(string =>
            string.setName('link')
                .setDescription('Link from where the raws are being ripped off.')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('download')
        .setDescription('Downloads a full series or its free chapters')
        .addStringOption(string =>
            string.setName('options')
                .setDescription('choose between free or full (full requires auth)')
                .setRequired(true)
                .addChoice('Full Series', 'full')
                .addChoice('Free chapters', 'free'))
        .addStringOption(string =>
            string.setName('link')
                .setDescription('link to the series')
                .setRequired(true))
        .addNumberOption(number =>
            number.setName('freeamount')
                .setDescription('How many free chapters this series has.')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a new series to the database, which you will be able to download raws from.')
        .addStringOption(string =>
            string.setName('title')
                .setDescription('Type the series title')
                .setRequired(true))
        .addStringOption(string =>
            string.setName('kakaoid')
                .setDescription('Type the kakao ID from this series')
                .setRequired(true))
        .addStringOption(number =>
            number.setName('cron')
                .setRequired(true)
                .setDescription('Cron time for the series weekly. Example: If the series releases 10PM KST, you must type 10'))
        .addBooleanOption(boolean =>
            boolean.setName('weekly')
                .setRequired(true)
                .setDescription('is the series weekly? true/false'))
        .addRoleOption(role =>
            role.setName('role')
                .setDescription('Role to be pinged every time a chapter is released')
                .setRequired(true))
        .addChannelOption(channel =>
            channel.setName('channel')
                .setDescription('channel in which the chapter will be sent')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('mass')
        .setDescription('Mass download a series.')
        .addStringOption(string =>
            string.setName('kakaoid')
                .setDescription('Type the kakaoID of the series.')
                .setRequired(true))
]

const rest = new REST({ version: '9' }).setToken(token);

const initialize = async () => {
    await rest.put(Routes.applicationCommands(clientID), {
        body: commands
    });

    console.log('Commands added.')
}

export default initialize;