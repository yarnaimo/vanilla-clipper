import { is, Rarray } from '@yarnaimo/rain'
import { getDomain } from 'tldjs'
import { VPage } from '../core/VPage'
import { sig } from '../utils'

export interface ISite {
    url: string
    accounts: {
        [label: string]:
            | {
                  isLoggedIn?: boolean
                  [key: string]: boolean | string | (() => string | Promise<string>) | undefined
              }
            | undefined
    }
    login: [PageAction, ...string[]][]
}

type PageAction = 'goto' | 'focus' | 'input' | 'click' | 'submit' | 'wait'

export class Sites {
    sites: ISite[]

    constructor(public siteDataList: ISite[]) {
        this.sites = siteDataList
    }

    findSite(url: string) {
        return this.sites.find(s => getDomain(s.url) === getDomain(url))
    }

    async login(site: ISite, vPage: VPage, accountLabel: string = 'default') {
        const account = site.accounts[accountLabel]
        if (!account) throw new Error(`Account "${accountLabel}" not found`)

        if (account.isLoggedIn) return

        sig.await('Logging in with account "%s"', accountLabel)

        await site.login.reduce(async (prevPromise, [action, ...args]) => {
            await prevPromise
            if (!action) return

            const computedArgs = await Rarray.waitAll(args, async a => {
                if (!a.startsWith('$')) return a

                const value = account[a.slice(1)]
                return is.undefined(value)
                    ? ''
                    : is.boolean(value)
                    ? String(value)
                    : is.string(value)
                    ? value
                    : value()
            })

            try {
                switch (action) {
                    case 'goto':
                        await vPage.frame.goto(computedArgs[0])
                        break

                    case 'focus':
                        await vPage.frame.focus(computedArgs[0])
                        break

                    case 'input':
                        await vPage.frame.type(computedArgs[0], computedArgs[1])
                        break

                    case 'click':
                        await vPage.frame.click(computedArgs[0])
                        break

                    case 'submit':
                        await vPage.frame.waitFor(1000)
                        await Promise.all([
                            vPage.frame.waitForNavigation({ waitUntil: 'networkidle2' }),
                            vPage.frame.click(computedArgs[0]),
                        ])
                        await vPage.frame.waitFor(1000)
                        break

                    default:
                }
            } catch (error) {
                sig.error(error)
            }
        }, Promise.resolve())

        account.isLoggedIn = true
    }
}
