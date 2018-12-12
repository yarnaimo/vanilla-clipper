import { VPluginStore } from './VPluginStore'

export const clonedDocumentPlugins = new VPluginStore()

// Clean
clonedDocumentPlugins.add(async vDocument => {
    await vDocument.eval(document => {
        const els = document.querySelectorAll(
            'script, style, link[rel=stylesheet], link[rel=preload], link[rel=dns-prefetch]'
        )
        els.forEach(el => el.remove())
    })
})

// Remove ads
clonedDocumentPlugins.add(async vDocument => {
    await vDocument.eval(document => {
        const els = document.querySelectorAll('ins.adsbygoogle')
        els.forEach(el => el.remove())
    })
})
