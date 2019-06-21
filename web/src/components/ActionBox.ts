import { Dispatch, FC } from 'react'
import { Card, CardActionIcon, CardActions } from 'rmwc'
import { $ } from 'tshx'
import { theme } from '../utils/color'

type Props = {
    placeholder: string
    inputBuffer: string
    setInputBuffer: Dispatch<string>
    emitInput: () => void
}

export const ActionBox: FC<Props> = props => {
    return $(Card, {
        className: 'mdc-elevation--z2',
        css: {
            borderRadius: 6,
            background: 'white',
            opacity: 0.8,
        },
    })(
        $(CardActions, {
            css: { height: 48, minHeight: 48, padding: 0 },
        })(
            $(CardActionIcon, { icon: 'arrow_back' })(),

            $('input', {
                value: props.inputBuffer,
                onChange: e => props.setInputBuffer(e.target.value.trim()),
                onKeyDown: e => {
                    if (e.keyCode === 13) {
                        props.emitInput()
                    }
                },

                className: 'mdc-text-field__input',
                placeholder: props.placeholder,
                css: {
                    border: 'none',
                    marginLeft: 8,
                    marginRight: 8,
                    height: '100%',
                    padding: 12,
                    caretColor: theme.secondary,
                    '&::placeholder': { opacity: 1 },
                },
            })(),

            $(CardActionIcon, { icon: 'filter_list' })(),
        ),
    )
    // $(TopAppBar, {
    //     fixed: true,
    //     css: { background: 'white' },
    // })(
    //     $(TopAppBarRow, {})(
    //         $(TopAppBarSection, { alignStart: true })(
    //             $(TopAppBarNavigationIcon, { icon: 'arrow_back' })(),

    //             $(TextField, {
    //                 value: props.inputBuffer,
    //                 onChange: (e: any) =>
    //                     props.setInputBuffer(e.target.value),
    //                 onKeyDown: (e: any) => {
    //                     if (e.keyCode === 13) {
    //                         props.emitInput()
    //                     }
    //                 },
    //                 fullwidth: true,
    //                 placeholder: 'Query or URL',
    //                 css: {
    //                     marginLeft: 8,
    //                     marginRight: 8,
    //                     height: '100%',
    //                 },
    //             })(),
    //             // $(Elevation, {
    //             //     z: 4,
    //             //     css: {
    //             //         zIndex: 10,
    //             //         position: 'absolute',
    //             //         width: '100%',
    //             //         bottom: 0,
    //             //         transform: 'translateY(100%)',
    //             //         background:'white'
    //             //     },
    //             // })(

    //             // ),

    //             $(TopAppBarActionItem, { icon: 'filter_list' })(),
    //         ),
    //     ),
    // ),

    // $(TopAppBarFixedAdjust, {})(),
    // $(SimpleTopAppBar, {
    //     // css: { background: 'white' },
    //     fixed: true,
    //     // navigationIcon: { onClick: () => setOpen(true) },
    //     // title: $(Responsive, media.default)('FRAIS') as any,
    //     startContent: $(ThemeProvider, {
    //         wrap: true,
    //         options: theme,
    //         style: {
    //             width: 'inherit',
    //             flex: 1,
    //             marginLeft: 8,
    //             marginRight: 8,
    //         },
    //     })(),
    // })(),
    // ),)
}
