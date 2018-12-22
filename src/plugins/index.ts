import { VPluginStore } from './VPluginStore'

export const plugins = new VPluginStore()

// clean
plugins.add(async vDocument => {
    await vDocument.eval(document => {
        const els = document.querySelectorAll(
            [
                'script',
                'style',
                'link[rel~=stylesheet]',
                'link[rel~=dns-prefetch]',
                'link[rel~=preload]',
                'link[rel~=preconnect]',
                'link[rel~=prefetch]',
                'link[rel~=prerender]',
            ].join()
        )

        els.forEach(el => el.remove())
    })
})

// remove ads
plugins.add(async vDocument => {
    await vDocument.eval(document => {
        const els = document.querySelectorAll(
            [
                'ins.adsbygoogle',
                'a[href^="https://rs.adapf.com"]',
                'iframe[src^="https://tpc.googlesyndication.com"]',
                'iframe[src^="https://googleads.g.doubleclick.net"]',
            ].join()
        )

        els.forEach(el => el.remove())
    })
})

// relative url to absolute
plugins.add(async vDocument => {
    await vDocument.eval(document => {
        const els = document.querySelectorAll(['[href]', '[src]'].join())

        els.forEach((el: any) => {
            const { href, src } = el
            if (href) el.href = href
            if (src) el.src = src
        })
    })
})
