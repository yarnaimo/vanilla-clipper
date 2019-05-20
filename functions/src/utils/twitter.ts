import { TwimoClient } from '@yarnaimo/twimo'
import { config } from '../config-store'

const client = config.twitter && new TwimoClient(config.twitter)

export async function getVideoURLInTweet(id: string) {
    if (!client) {
        return
    }

    return client.getVideoURLInTweet(id)
}
