import { is } from '@yarnaimo/rain'
import { twget, Twimo } from '@yarnaimo/twimo'
import { Status } from 'twitter-d'
import { config } from '../config-store'

export async function getTwitterVideoURL(id: string) {
    const types = new Map([['video', 'video'], ['animated_gif', 'gif']])

    if (!config.twitter) {
        return
    }

    const { consumerKey, consumerSecret, token, tokenSecret } = config.twitter
    const twimo = Twimo({
        consumerKey,
        consumerSecret,
    })({
        token,
        tokenSecret,
    })

    const { extended_entities } = await twget<Status>(twimo, 'statuses/show', { id })

    if (
        !extended_entities ||
        !extended_entities.media ||
        !extended_entities.media[0] ||
        !extended_entities.media[0].video_info ||
        !extended_entities.media[0].video_info.variants
    ) {
        return
    }

    const {
        type,
        video_info: { variants },
    } = extended_entities.media[0]

    const largest = variants.sort((a, b) => {
        return (b.bitrate || 0) - (a.bitrate || 0)
    })[0]

    const mediaType = types.get(type)

    if (!mediaType || !is.string(largest.url)) {
        return
    }

    return {
        type: mediaType,
        url: largest.url,
    }
}
