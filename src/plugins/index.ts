import { VPluginStore } from './VPluginStore'

export const jsdomPlugins = new VPluginStore()

// clean
jsdomPlugins.add(getElements => {
    const els = getElements(
        'script',
        'style',
        'link[rel~=stylesheet]',
        'link[rel~=dns-prefetch]',
        'link[rel~=preload]',
        'link[rel~=preconnect]',
        'link[rel~=prefetch]',
        'link[rel~=prerender]'
    )

    els.forEach(el => el.remove())
})

// remove ads
jsdomPlugins.add(getElements => {
    const els = getElements(
        'ins.adsbygoogle',
        'a[href^="https://rs.adapf.com"]',
        'iframe[src^="https://tpc.googlesyndication.com"]',
        'iframe[src^="https://googleads.g.doubleclick.net"]'
    )

    els.forEach(el => el.remove())
})

// relative url to absolute
jsdomPlugins.add(getElements => {
    const els = getElements('[href]', '[src]')

    els.forEach((el: any) => {
        const { href, src } = el
        if (href) el.href = href
        if (src) el.src = src
    })
})
