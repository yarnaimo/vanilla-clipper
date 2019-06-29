import { HookRouter, useRoutes } from 'hookrouter'
import { FC, useEffect } from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerSubtitle,
    DrawerTitle,
} from 'rmwc'
import { $, $$ } from 'tshx'
import { useMediaLayout } from 'use-media'
import { useStores } from '../Store'
import { useBool } from '../utils/hooks'
import { Footer } from './Footer'
import { Home } from './Home'
import { Login } from './Login'
import { NoteC } from './Note'

const routes: HookRouter.RouteObject = {
    '/': () => $(Home, {})(),
    '/login': () => $(Login, {})(),
    '/notes/:id': ({ id }) => $(NoteC, { id })(),
}

type Props = {}

export const Main: FC<Props> = props => {
    const { layout } = useStores()

    const isLow = useMediaLayout({ maxHeight: 319 })
    useEffect(() => {
        layout.set('isLow')(isLow)
    }, [isLow])

    const route = useRoutes(routes)

    const drawerState = useBool(false)
    const drawer = $(Drawer, {
        modal: true,
        open: drawerState.value,
        onClose: drawerState.setFalse,
    })(
        $(DrawerHeader, {})(
            $(DrawerTitle, {})('DrawerHeader'),
            $(DrawerSubtitle, {})('Subtitle'),
        ),
        $(DrawerContent, {})(),
    )

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
        route,

        layout.get('isLow') || layout.get('CEToolbar') || $(Footer, {})(),

        drawer,
    )
}
