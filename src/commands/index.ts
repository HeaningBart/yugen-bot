import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9';
const { token, clientID } = require('../../config.json');


const commands = [
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
        .addStringOption(string =>
            string.setName('cron')
                .setRequired(true)
                .setDescription('Release day of the series, it must be one of the options already set')
                .addChoice('Monday', 'monday')
                .addChoice('Tuesday', 'tuesday')
                .addChoice('Wednesday', 'wednesday')
                .addChoice('Thursday', 'thursday')
                .addChoice('Friday', 'friday')
                .addChoice('Saturday', 'saturday')
                .addChoice('Sunday', 'sunday')
        )
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
                .setRequired(true))
        .addIntegerOption(integer =>
            integer.setName('priority')
                .setDescription('Priorty of the series')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('getseries')
        .setDescription('Get all series from database')
        .addStringOption(string =>
            string.setName('releaseday')
                .setDescription('Choose the release day')
                .addChoice('Monday', 'monday')
                .addChoice('Tuesday', 'tuesday')
                .addChoice('Wednesday', 'wednesday')
                .addChoice('Thursday', 'thursday')
                .addChoice('Friday', 'friday')
                .addChoice('Saturday', 'saturday')
                .addChoice('Sunday', 'sunday')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edit a series from the database')
        .addNumberOption(number =>
            number.setName('kakaoid')
                .setDescription('Enter the kakao series ID.')
                .setRequired(true)
        )
        .addBooleanOption(boolean =>
            boolean.setName('weekly')
                .setDescription('Enter the weekly status of this series.')
                .setRequired(true))
        .addIntegerOption(integer =>
            integer.setName('priority')
                .setDescription('Priorty of the series')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a series from our database')
        .addStringOption(string =>
            string.setName('kakaoid')
                .setDescription('Type the kakaoID of the series.')
                .setRequired(true)),


    new SlashCommandBuilder()
        .setName('getchapter')
        .setDescription('RP a chapter from kakao')
        .addStringOption(string =>
            string.setName('kakaoid')
                .setDescription('KAKAO ID of the series')
                .setRequired(true))
        .addIntegerOption(integer =>
            integer.setName('chapternumber')
                .setDescription('number of the chapter')
                .setRequired(true))
        .addStringOption(string => string.setName('seriestitle').setDescription('title of the series in your language').setRequired(true))

]

const rest = new REST({ version: '9' }).setToken(token);

const initialize = async () => {
    await rest.put(Routes.applicationCommands(clientID), {
        body: commands
    });

    console.log('Commands added.')
}

export default initialize;