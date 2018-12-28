import { resolve } from 'path'
import { VBrowser } from '..'

export const launch = async () => {
    return VBrowser.launch(true, {})
}

export const publicFilePath = (name: string) => resolve('src/__tests__/fixture/public', name)

export const servedFileURL = (path: string) => `http://localhost:3000/${path}`
