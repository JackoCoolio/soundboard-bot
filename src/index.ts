import { Client, MessageEmbed } from 'discord.js'
import { log } from './log'
import { VoiceManager } from './voicemanager'
import {
    getSound,
    getSounds,
    initialize,
    initializeNewGuild,
    soundExists,
} from './sounds'

// load config
import * as config from '../config.json'
// load .env
import * as dotenv from 'dotenv'
dotenv.config()

const client = new Client()
const voiceManager = new VoiceManager(client)

client.on('ready', () => {
    log('Soundboard bot online!')

    client.user.setPresence({
        activity: {
            type: 'STREAMING',
            name: '._.',
            url: 'https://www.youtube.com/watch?v=VPTNGjX7Moo',
        },
    })

    initialize(client).catch(log)
})

client.on('guildCreate', guild => {
    initializeNewGuild(guild).then(() => {
        log('Joined a new guild!')
        log(guild)
    })
})

client.on('error', error => {
    log('Encountered an error!')
})

client.on('message', async message => {
    if (message.author.bot) return // ignore bots
    if (!message.content.startsWith(config.prefix)) return // ignore non-commands

    log('Received a message!')

    const tokens = message.content.split(' ')
    const command = tokens[0].slice(config.prefix.length)

    if (command.toLocaleLowerCase() === 'ping') {
        message.channel.send(new MessageEmbed().setTitle('Pong!')).then(() => {
            message.delete().catch(log)
        }).catch(log)
    } else if (command.toLocaleLowerCase() === 'list') {
        // this is will not work if message length is > 2000 chars

        const sounds = getSounds(message.guild.id)

        if (sounds.length === 0) {
            try {
                return message.channel.send('No sounds added!')
            } catch (message_1) {
                return log(message_1)
            }
        }

        let output = ''
        for (const sound of sounds) {
            output += sound + '\n'
        }

        message.channel.send(output).then(() => {
            message.delete().catch(log)
        }).catch(log)
    } else {
        const voiceChannel = message.member.voice.channel

        if (soundExists(message.guild.id, command.toLocaleLowerCase())) {
            const sound = getSound(message.guild.id, command)

            log(sound)

            voiceManager
                .join(voiceChannel)
                .then(() => {
                    voiceManager
                        .play(message.guild, sound)
                        .then(() => {
                            voiceManager.leave(message.guild.id)
                            message.delete().catch(log)
                        })
                        .catch(log)
                })
                .catch(log)
        } else {
            message.channel.send("That sound doesn't exist!").then(() => {
                message.delete().catch(log)
            }).catch(log)
        }
    }
})

client.login(process.env.DISCORD_TOKEN)
