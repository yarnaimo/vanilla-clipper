import { auth } from 'firebase'
import { useRoutes } from 'hookrouter'
import { FC, useMemo } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerSubtitle,
    DrawerTitle,
} from 'rmwc'
import { $, $$ } from 'tshx'
import { useMediaLayout } from 'use-media'
import { Container } from '../components/Container'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Section } from '../components/Section'
import { authProvider } from '../utils/firebase'
import { useBool } from '../utils/hooks'
import { Footer } from './Footer'
import { routes } from './routes'

type Props = {}

export const App: FC<Props> = props => {
    const [user, initializing, error] = useAuthState(auth())
    const login = () => {
        auth().signInWithPopup(authProvider)
    }

    const isLow = useMediaLayout({ maxHeight: 319 })

    const route = useRoutes(routes)

    const view = useMemo(() => {
        if (error) {
            return $('p', {})(error)
        }

        if (initializing) {
            return $(LoadingSpinner, {})()
        }

        if (!user) {
            return $(Button, {
                icon: 'exit_to_app',
                unelevated: true,
                onClick: login,
            })('ログイン')
        }

        return null
    }, [error, initializing, user])

    const drawer = useBool(false)

    return $$(
        // $(ThemeProvider, {
        //     wrap: true,
        //     options: {
        //         primary: 'white',
        //         // onSurface: 'green',
        //         // onPrimary: 'red',
        //         // textPrimaryOnBackground: 'blue',
        //     },
        // })(

        view ? $(Container, {})($(Section, {})(view)) : route,

        isLow || $(Footer, {})(),

        $(Drawer, {
            modal: true,
            open: drawer.value,
            onClose: drawer.setFalse,
        })(
            $(DrawerHeader, {})(
                $(DrawerTitle, {})('DrawerHeader'),
                $(DrawerSubtitle, {})('Subtitle'),
            ),
            $(DrawerContent, {})(),
        ),
    )
}
