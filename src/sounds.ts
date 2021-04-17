import { get } from 'https'
import { existsSync, mkdirSync, createWriteStream } from 'fs'
import { readdir, readFile, writeFile } from 'fs/promises'
import { Client, Collection, GuildMember, Message } from 'discord.js'
import { log } from './log'
import { getGuildID, GuildRepresentation } from './types'

interface SoundList {
    [alias: string]: string
}

const soundDir = './sounds'
const soundLists: Collection<
    string,
    SoundList
> = new Collection()

export async function initialize(client: Client): Promise<void> {
    client.guilds.cache.forEach(async (guild, id) => {
        readFile(`${soundDir}/${id}/sounds.json`).then(data => {
            const list: SoundList = JSON.parse(data.toString()).sounds
            soundLists.set(id, list)
        }).catch(() => {
            initializeNewGuild(id)
            soundLists.set(id, {})
        })
    })
}

export async function initializeNewGuild(
    guild: GuildRepresentation,
): Promise<void> {
    writeFile(`${soundDir}/${getGuildID(guild)}/sounds.json`, '{"sounds":{}}').catch(log)
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
