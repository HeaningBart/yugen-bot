import { Client, Intents } from 'discord.js';
const { token } = require('../config.json')
const { buyTicket } = require('./rawhandler/index.js');
import initialize from './commands';
import Handler from './handlers';

const allowedUsers = ['397857749938995201', '345938621137944577']



const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});



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

buyTicket('58634756');

client.login(token);
initialize();
