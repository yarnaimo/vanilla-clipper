import { buildVAttrSelector, selectorsToString } from '../utils/element'

test('getVAttrSelector()', () => {
    expect(buildVAttrSelector.iframeUuid()).toBe('[data-vanilla-clipper-iframe-uuid]')
})

test('getVAttrSelector(value)', () => {
    expect(buildVAttrSelector.iframeUuid('1234')).toBe('[data-vanilla-clipper-iframe-uuid="1234"]')
})

test('selectorWithNot()', () => {
    expect(selectorsToString({ selector: '[src]', not: ['[src=""]', 'iframe'] })).toBe(
        '[src]:not([src=""]):not(iframe)',
    )
})
