import { is, Rarray } from '@yarnaimo/rain'
import { ISite } from '.'
import { VPage } from '../core/VPage'

export const Site = (site: ISite) => ({
    ...site,

    async login(vPage: ReturnType<typeof VPage>, accountLabel: string = 'default') {
        const account = site.accounts[accountLabel]

        if (!account) {
            console.warn(`Account "${accountLabel}" not found`)
            return
        }
        if (account.isLoggedIn) {
            return
        }

        console.info('Logging in with account "%s"', accountLabel)

        await site.login.reduce(async (prevPromise, [action, ...args]) => {
            await prevPromise

            if (!action) {
                return
            }

            const computedArgs = await Rarray.waitAll(args, async a => {
                if (!a.startsWith('$')) {
                    return a
                }

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
                        await vPage.frame.waitFor(2000)
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
            } catch (err) {
                console.error(err)
            }
        }, Promise.resolve())

        account.isLoggedIn = true
    },
})
