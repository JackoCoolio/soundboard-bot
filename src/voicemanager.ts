import {
    Client,
    Collection,
    StreamDispatcher,
    StreamOptions,
    VoiceChannel,
    VoiceConnection,
} from 'discord.js'

import { getGuildID, GuildRepresentation } from './types'

/**
 * Manages StreamDispatchers for all connected guilds.
 */
export class VoiceManager {
    client: Client
    dispatchers: Collection<string, StreamDispatcher>

    constructor(client: Client) {
        this.client = client
        this.dispatchers = new Collection()
    }

    private getDispatcher(guild: GuildRepresentation): StreamDispatcher {
        const dispatcher = this.dispatchers.get(getGuildID(guild))
        if (!dispatcher)
            throw new Error('No StreamDispatcher for the current guild!')
        return dispatcher
    }

    /**
     * Join the specified VoiceChannel.
     * @returns a Promise with the resulting VoiceConnection. The VoiceManager will keep track of this though.
     */
    async join(channel: VoiceChannel): Promise<VoiceConnection> {
        return await channel.join()
    }

    /**
     * Leaves the connected channel in the specified guild.
     */
    leave(guild: GuildRepresentation): void {
        this.client.voice.connections.get(getGuildID(guild)).disconnect()
    }

    /**
     * Plays an audio file in the specified Guild.
     */
    async play(
        guild: GuildRepresentation,
        input: string,
        options?: StreamOptions,
    ) {
        return new Promise<void>((resolve, reject) => {
            const id = getGuildID(guild)
            const conn = this.client.voice.connections.get(id)

            const dispatcher = conn.play(input, options)
            dispatcher.on('finish', resolve)
            dispatcher.on('error', reject)
            this.dispatchers.set(id, dispatcher)
        })
    }

    /**
     * discord.js.org: Sets the volume relative to the input stream - i.e. 1 is normal, 0.5 is half, 2 is double.
     *
     * @param guild the Guild to set the volume for
     * @param volume the volume
     */
    setVolume(guild: GuildRepresentation, volume: number): void {
        const dispatcher = this.getDispatcher(guild)

        dispatcher.setVolume(volume)
    }

    /**
     * Pauses the stream dispatcher for the specified guild.
     */
    pause(guild: GuildRepresentation): void {
        const dispatcher = this.getDispatcher(guild)

        dispatcher.pause(true) // set to false by default, but docs make it sound like true is better?
    }

    /**
     * Resumes playback in the specified guild.
     */
    resume(guild: GuildRepresentation): void {
        const dispatcher = this.getDispatcher(guild)

        dispatcher.resume()
    }

    /**
     * Ends the currently playing audio in the specified guild.
     */
    stop(guild: GuildRepresentation) {
        const dispatcher = this.getDispatcher(guild)

        dispatcher.end()
    }

    /**
     * Returns true if the stream dispatcher for the specified guild is paused.
     */
    isPaused(guild: GuildRepresentation): boolean {
        const dispatcher = this.getDispatcher(guild)

        return dispatcher.paused
    }

    /**
     * Returns the volume of the stream dispatcher for the specified guild.
     */
    getVolume(guild: GuildRepresentation): number {
        const dispatcher = this.getDispatcher(guild)

        return dispatcher.volume
    }
}
