import { resolve } from 'path'
import { dataPath, extractExtensionFromURL, newFilePath } from '../utils/file'

test('extractExtensionFromURL()', () => {
    expect(extractExtensionFromURL('main.css')).toBe('css')
    expect(extractExtensionFromURL('"main.css"')).toBe('css')
    expect(extractExtensionFromURL('main.css#a')).toBe('css')
    expect(extractExtensionFromURL('"main.css#a"')).toBe('css')
})

test('newFilePath()', async () => {
    expect(await newFilePath('pages', 'title')).toBe(resolve('pages', 'title.html'))
    expect(await newFilePath('pages', 'title', 'css')).toBe(resolve('pages', 'title.css'))
})

test('dataPath()', () => {
    expect(dataPath('resources')).toBe(resolve('tmp', '__data__', 'resources'))
})
