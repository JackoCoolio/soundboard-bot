import { get } from 'https'
import { existsSync, mkdirSync, createWriteStream } from 'fs'
import { readdir, readFile, writeFile, copyFile } from 'fs/promises'
import { Client, Collection, GuildMember, Message } from 'discord.js'
import { log } from './log'
import { getGuildID, GuildRepresentation } from './types'
import { exists } from 'node:fs'
import { fileURLToPath } from 'node:url'

interface SoundList {
    [alias: string]: string
}

const soundDir = './sounds'
const soundLists: Collection<string, SoundList> = new Collection()

interface SessionData {
    file?: string
    alias?: string
}
const addSessions: Collection<string, SessionData> = new Collection()

export async function initialize(client: Client): Promise<void> {
    client.guilds.cache.forEach(async (guild, id) => {
        readFile(`${soundDir}/${id}/sounds.json`)
            .then(data => {
                const list: SoundList = JSON.parse(data.toString()).sounds
                soundLists.set(id, list)
            })
            .catch(() => {
                initializeNewGuild(id)
                soundLists.set(id, {})
            })
    })
}

export async function initializeNewGuild(
    guild: GuildRepresentation,
): Promise<void> {
    writeFile(
        `${soundDir}/${getGuildID(guild)}/sounds.json`,
        '{"sounds":{}}',
    ).catch(log)
}

export function soundExists(
    guild: GuildRepresentation,
    alias: string,
): boolean {
    return soundLists.get(getGuildID(guild)).hasOwnProperty(alias)
}

export function getSounds(guild: GuildRepresentation): Array<string> {
    return Object.keys(soundLists.get(getGuildID(guild)))
}

export function getSound(guild: GuildRepresentation, alias: string): string {
    const id = getGuildID(guild)
    const name = soundLists.get(getGuildID(guild))[alias]

    if (!name) return

    return `${soundDir}/${id}/${name}`
}

function addSound(guild: string, alias: string, filepath: string): void {}

export function startAddSession(member: GuildMember): void {
    addSessions.set(member.id, {})

    // delete the session after 30 minutes
    setTimeout(() => {
        addSessions.delete(member.id)
    }, 1800000)
}

export function handleAddSession(message: Message): void {
    const member = message.member

    if (!addSessions.has(member.id)) return

    const session = addSessions.get(member.id)

    if (message.attachments.size > 0) {
        if (message.attachments.size > 1) {
            message.channel.send('Send only one file, please!').catch(log)
            return
        }

        const attachment = message.attachments.first()
        const url = attachment.url

        const filename = `${soundDir}/temp/${member.id}.${url.split('.').pop()}`
        const file = createWriteStream(filename)
        get(url, response => {
            response.pipe(file)

            message.channel.send(
                'File downloaded! What do you want the sound to be called?',
            )

            session.file = filename
        })
    } else {
        if (!session.file) {
            message.channel.send('Send the file first!').catch(log)
            return
        }

        if (message.content.length === 0) {
            message.channel.send('Error!').catch(log)
            return
        }

        session.alias = message.content
    }

    if (session.file !== undefined && session.alias !== undefined) {
        const id = message.guild.id
        let extension = session.file.split('.').pop()
        let path = session.alias.replace(/[^a-z0-9]/gi, '_').toLocaleLowerCase()

        // If a file with this name already exists, add a random string to the end.
        // There is a one in a million chance that this ends up intersecting with another file
        // if this operation already happened under the same circumstances.
        if (existsSync(`${soundDir}/${message.guild.id}/${path}`)) {
            path += (Math.random() * 1000000).toString(16)
        }

        soundLists.get(id)[session.alias] = `${path}.${extension}`

        addSessions.delete(member.id)

        Promise.all([
            writeFile(
                `${soundDir}/${id}/sounds.json`,
                JSON.stringify(
                    {
                        sounds: soundLists.get(id),
                    },
                    undefined,
                    '    ',
                ),
            ),
            copyFile(session.file, `${soundDir}/${message.guild.id}/${path}.${extension}`),
        ])
            .then(() => {
                message.channel.send('Successfully added the sound!').catch(log)
            })
            .catch(log)
    }
}
