import { Client, Guild } from 'discord.js'

export type GuildRepresentation = Guild | string

export function getGuildID(repr: GuildRepresentation): string {
    if (typeof repr === 'string') {
        return repr
    } else {
        return repr.id
    }
}

export async function getGuild(
    repr: GuildRepresentation,
    client: Client,
): Promise<Guild> {
    if (typeof repr === 'string') {
        return client.guilds.fetch(repr)
    } else {
        return repr
    }
}
