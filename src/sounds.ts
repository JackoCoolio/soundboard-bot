import { existsSync, mkdirSync } from 'fs'
import { readdir } from 'fs/promises'
import { Client, Collection, Guild } from 'discord.js'
import { log } from './log'
import { getGuildID, GuildRepresentation } from './types'

const soundDir = './sounds'
const soundLists: Collection<
    string,
    Collection<string, string>
> = new Collection()

export async function initialize(client: Client): Promise<void> {
    client.guilds.cache.forEach(async (guild, id) => {
        soundLists.set(id, new Collection())

        await refreshSounds(id)
    })
}

export function getFile(guild: GuildRepresentation, alias: string): string {
    return soundLists.get(getGuildID(guild)).get(alias)
}

export async function refreshSounds(guild: GuildRepresentation): Promise<void> {
    const id = getGuildID(guild)
    const list = soundLists.get(id)

    list.clear()

    const dir = `${soundDir}/${id}`
    if (!existsSync(dir)) {
        mkdirSync(dir)
    }

    readdir(dir)
        .then(files => {
            for (const file of files) {
                const name = file.split('.')[0].toLocaleLowerCase()
                list.set(name, file)
            }
        })
        .catch(log)
}

export async function initializeNewGuild(
    guild: GuildRepresentation,
): Promise<void> {
    return refreshSounds(guild)
}

export function soundExists(
    guild: GuildRepresentation,
    alias: string,
): boolean {
    return soundLists.get(getGuildID(guild)).has(alias)
}

export function getSounds(guild: GuildRepresentation): Array<string> {
    return soundLists.get(getGuildID(guild)).keyArray()
}

export function getSound(guild: GuildRepresentation, alias: string): string {
    const id = getGuildID(guild)
    const name = soundLists.get(getGuildID(guild)).get(alias)

    return `${soundDir}/${id}/${name}`
}
