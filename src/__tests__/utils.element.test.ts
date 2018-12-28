import { getVAttrSelector, selectorsToString } from '../utils/element'

test('getVAttrSelector()', () => {
    expect(getVAttrSelector.iframeUuid()).toBe('[data-vanilla-clipper-iframe-uuid]')
})

test('getVAttrSelector(value)', () => {
    expect(getVAttrSelector.iframeUuid('1234')).toBe('[data-vanilla-clipper-iframe-uuid="1234"]')
})

test('selectorWithNot()', () => {
    expect(selectorsToString({ selector: '[src]', not: ['[src=""]', 'iframe'] })).toBe(
        '[src]:not([src=""]):not(iframe)'
    )
})
