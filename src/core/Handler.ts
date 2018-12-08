export class Handler {
    static clean(document: Document) {
        const els = document.querySelectorAll(
            'script, style, link[rel=stylesheet], link[rel=preload], link[rel=dns-prefetch]'
        )
        els.forEach(el => el.remove())
    }

    static getStyleSheets(document: Document) {
        const sheets = [...document.styleSheets]
            .filter((s): s is CSSStyleSheet => s instanceof CSSStyleSheet)
            .filter(s => !s.disabled)

        return sheets.map(s => {
            if (s.href) {
                return { link: s.href }
            } else {
                try {
                    return { text: [...s.cssRules].map(rule => rule.cssText).join('\n') }
                } catch (error) {
                    return { error: error.toString() as string }
                }
            }
        })
    }

    static reallocateCSS(document: Document, cssTexts: string[]) {
        const styleElements = cssTexts.map(text => {
            const el = document.createElement('style')
            el.dataset.vanillaStyle = ''
            el.innerHTML = text
            return el
        })
        document.querySelector('head')!.append(...styleElements)
    }

    static async data(document: Document) {
        // const getAsBase64 = async (url: string) => {
        //     const response = await fetch(url)
        //     const blob = await response.blob()

        //     return new Promise<string>((resolve, reject) => {
        //         const reader = new FileReader()
        //         reader.onloadend = () => resolve(reader.result as string)
        //         reader.onerror = () => reject()
        //         reader.readAsDataURL(blob)
        //     })
        // }

        // const dataMap = {} as DataMap

        // const addToDataMap = async (url: string) => {
        //     if (url in dataMap) return

        //     const data = await getAsBase64(url).catch(() => null)
        //     if (data !== null) dataMap[url] = data
        // }

        const elements = [
            ...document.querySelectorAll("[src]:not([src='']), [href]:not([href='']):not(a)"),
        ] as HTMLElement[]

        const urls = elements.reduce(
            (_urls, el) => {
                const { src, href } = el as any

                if (src) {
                    _urls.push(src)
                    el.dataset.vanillaSrc = src
                    el.removeAttribute('src')
                }
                if (href) {
                    _urls.push(href)
                    el.dataset.vanillaHref = href
                    el.removeAttribute('href')
                }
                return _urls
            },
            [] as string[]
        )

        return urls
    }

    static appendScript(document: Document, scriptString: string) {
        const el = document.createElement('script')
        el.dataset.vanillaScript = ''
        el.innerHTML = scriptString
        document.body.appendChild(el)
    }
}
