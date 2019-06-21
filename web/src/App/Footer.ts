import { A } from 'hookrouter'
import { FC } from 'react'
import {
    Fab,
    Toolbar,
    ToolbarMenuIcon,
    ToolbarRow,
    ToolbarSection,
    ToolbarTitle,
    TopAppBarFixedAdjust,
} from 'rmwc'
import { $, $$ } from 'tshx'
import { theme } from '../utils/color'

type Props = {}

export const Footer: FC<Props> = props => {
    return $$(
        $(TopAppBarFixedAdjust, {})(),

        $(Toolbar, {
            className: 'mdc-elevation--z4',
            css: {
                position: 'fixed',
                bottom: 0,
                color: theme.onPrimary,
            },
        })(
            $(ToolbarRow, {})(
                $(ToolbarSection, { alignStart: true })(
                    $(ToolbarMenuIcon, { icon: 'menu' })(),
                    $(ToolbarTitle, {})('Toolbar'),
                ),
                $(ToolbarSection, { alignEnd: true })(),
                // $(ToolbarIcon, { icon: 'save' })(),
            ),
            $(A, { href: '/notes/new' })(
                $(Fab, {
                    icon: 'note_add',
                    css: {
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                    },
                })(),
            ),
        ),
    )
}
