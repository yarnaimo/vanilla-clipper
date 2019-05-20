import { twimgUrlToOrig } from '@yarnaimo/twimo'
import { VJsdom } from '../core/VJsdom'

export type VPlugin = (dom: VJsdom) => void

const plugins = [] as VPlugin[]

const add = (vPlugin: VPlugin) => plugins.push(vPlugin)

export const execPlugins = (dom: VJsdom) => plugins.forEach(plugin => plugin(dom))

// set charset utf-8
add(dom => {
    const els = dom.finder('meta[charset]')
    els.forEach(el => el.remove())

    const meta = dom.document.createElement('meta')
    meta.setAttribute('charset', 'utf-8')

    dom.document.head.prepend(meta)
})

// clean
add(dom => {
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
add(dom => {
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

// twimg urls to orig
add(dom => {
    const els = dom.finder('img[src^="https://pbs.twimg.com/media/"]')

    els.forEach((el: any) => {
        el.src = twimgUrlToOrig(el.src)
    })
})

// relative url to absolute
add(dom => {
    const els = dom.finder('[href]', '[src]')

    els.forEach((el: any) => {
        const { href, src } = el
        if (href && !el.getAttribute('href').startsWith('#')) el.href = href
        if (src) el.src = src
    })
})

// make <body> scrollable
add(dom => {
    dom.document.body.style.overflow = 'auto'
})
