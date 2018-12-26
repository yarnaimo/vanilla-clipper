import { is } from '@yarnaimo/rain'

const createVAttrFn = (attrName: string) => (value?: string) =>
    `[${attrName}${value ? `="${value.replace(/"/g, '\\"')}"` : ''}]`

export const getVAttrSelector = {
    src: createVAttrFn('data-vanilla-clipper-src'),
    href: createVAttrFn('data-vanilla-clipper-href'),
    style: createVAttrFn('data-vanilla-clipper-style'),
    script: createVAttrFn('data-vanilla-clipper-script'),
    iframeUuid: createVAttrFn('data-vanilla-clipper-iframe-uuid'),
}

export type ElementSelector = string | { selector: string; not: string[] }

export type ElementFinder = (...selectors: ElementSelector[]) => HTMLElement[]

export const selectorsToString = (...selectors: ElementSelector[]) =>
    selectors
        .map(s =>
            is.string(s)
                ? s
                : s.not.reduce((prev, current) => `${prev}:not(${current})`, s.selector)
        )
        .join(', ')

export const createElementFinder = (document: Document): ElementFinder => (...selectors) => [
    ...document.querySelectorAll<HTMLElement>(selectorsToString(...selectors)),
]
