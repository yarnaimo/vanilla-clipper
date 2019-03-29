import { VPluginStore } from './VPluginStore'

export const jsdomPlugins = new VPluginStore()

// set charset utf-8
jsdomPlugins.add(dom => {
    const els = dom.finder('meta[charset]')
    els.forEach(el => el.remove())

    const meta = dom.document.createElement('meta')
    meta.setAttribute('charset', 'utf-8')

    dom.document.head.prepend(meta)
})

// clean
jsdomPlugins.add(dom => {
    const els = dom.finder(
        'script',
        'style',
        'link[rel~=stylesheet]',
        'link[rel~=dns-prefetch]',
        'link[rel~=preload]',
        'link[rel~=preconnect]',
        'link[rel~=prefetch]',
        'link[rel~=prerender]',
    )

    els.forEach(el => el.remove())
})

// remove ads
jsdomPlugins.add(dom => {
    const els = dom.finder(
        'ins.adsbygoogle',
        'a[href^="https://rs.adapf.com"]',
        'iframe[id^="google_ads_iframe_"]',
        'iframe[src^="https://bid.g.doubleclick.net"]',
        'iframe[src^="https://tpc.googlesyndication.com"]',
        'iframe[src^="https://googleads.g.doubleclick.net"]',
        'iframe[src^="https://img.ak.impact-ad.jp"]',
        'iframe[src*=".fls.doubleclick.net/"]',
    )

    els.forEach(el => el.remove())
})

// relative url to absolute
jsdomPlugins.add(dom => {
    const els = dom.finder('[href]', '[src]')

    els.forEach((el: any) => {
        const { href, src } = el
        if (href && !el.getAttribute('href').startsWith('#')) el.href = href
        if (src) el.src = src
    })
})

// make <body> scrollable
jsdomPlugins.add(dom => {
    dom.document.body.style.overflow = 'auto'
})
