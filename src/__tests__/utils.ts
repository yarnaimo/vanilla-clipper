import { VBrowser } from '..'

export const launch = async () => {
    return VBrowser.launch(true, { dumpio: true, executablePath: '' })
}
