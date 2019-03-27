import { is } from '@yarnaimo/rain'

const createVAttrFn = (attrName: string) => (value?: string) =>
    `[${attrName}${value ? `="${value.replace(/"/g, '\\"')}"` : ''}]`

export const buildVAttrSelector = {
    src: createVAttrFn('data-vanilla-clipper-src'),
    href: createVAttrFn('data-vanilla-clipper-href'),
    style: createVAttrFn('data-vanilla-clipper-style'),
    script: createVAttrFn('data-vanilla-clipper-script'),
    video: createVAttrFn('data-vanilla-clipper-video'),
    iframeUuid: createVAttrFn('data-vanilla-clipper-iframe-uuid'),
    shadowContent: createVAttrFn('data-vanilla-clipper-shadow-content'),
}

export type ElementSelector = string | { selector: string; not: string[] }

export const selectorsToString = (...selectors: ElementSelector[]) =>
    selectors
        .map(s =>
            is.string(s)
                ? s
                : s.not.reduce((prev, current) => `${prev}:not(${current})`, s.selector),
        )
        .join(', ')
