import { EditorConfig } from '@editorjs/editorjs'
import { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { render } from 'react-dom'
import { $ } from 'tshx'
import { ArticleC } from '../../App/Article'
import { useStores } from '../../Store'
import { customTools } from './tools'
const EditorJS = require('@stfy/react-editor.js')

// const r = (name: string) => require(`@editorjs/${name}`)

// const Embed = r('embed')
// const Table = r('table')
// const Paragraph = r('paragraph')
// const List = r('list')
// const Warning = r('warning')
// const Code = r('code')
// const Link = r('link')
// const Image = r('image')
// const Raw = r('raw')
// const Header = r('header')
// const Quote = r('quote')
// const Marker = r('marker')
// const CheckList = r('checklist')
// const Delimiter = r('delimiter')
// const InlineCode = r('inline-code')

// export const plugins = {
//     embed: Embed,
//     table: Table,
//     paragraph: Paragraph,
//     list: List,
//     warning: Warning,
//     code: Code,
//     link: Link,
//     image: Image,
//     raw: Raw,
//     header: Header,
//     quote: Quote,
//     marker: Marker,
//     checklist: CheckList,
//     delimiter: Delimiter,
//     inlineCode: InlineCode,
// }

type Props = {
    holderId?: EditorConfig['holderId']
    // customTools?: EditorConfig['tools']
    excludeDefaultTools?: string[]
    onChange?: EditorConfig['onChange']
    // onReady?: EditorConfig['onReady']
    data?: EditorConfig['data']
    autofocus?: EditorConfig['autofocus']
}

export const Editor: FC<Props> = props => {
    const { layout } = useStores()

    const toolbarObserver = useMemo(() => {
        const { observe, disconnect } = new MutationObserver(([record]) => {
            if (record && record.target instanceof HTMLDivElement) {
                const isOpen = record.target.classList.contains(
                    'ce-toolbar--opened',
                )
                layout.set('CEToolbar')(isOpen)
            }
        })
        return {
            observe: (root: HTMLDivElement) => {
                const ceToolbar = root.querySelector('.ce-toolbar')
                if (ceToolbar) {
                    observe(ceToolbar, {
                        attributes: true,
                        attributeFilter: ['class'],
                    })
                }
            },
            disconnect,
        }
    }, [])

    const embedObserver = useMemo(() => {
        const handleNode = (el: Node) => {
            if (
                el instanceof HTMLDivElement &&
                el.classList.contains('article-embed') &&
                (el as any).src
            ) {
                render(
                    $(ArticleC, {
                        id: (el as any).src,
                        embed: true,
                    })(),
                    el,
                )
            }
        }
        const { observe, disconnect } = new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(handleNode))
        })
        return {
            observe: (root: HTMLDivElement) => {
                const redactor = root.querySelector('codex-editor__redactor')
                if (redactor) {
                    observe(redactor, {
                        childList: true,
                        subtree: true,
                    })
                }
            },
            disconnect,
        }
    }, [])

    const rootRef = useRef<HTMLDivElement>()

    const onReady = useCallback(() => {
        if (!rootRef.current) {
            return
        }

        toolbarObserver.observe(rootRef.current)
        embedObserver.observe(rootRef.current)
    }, [rootRef.current])

    useEffect(() => {
        return () => {
            toolbarObserver.disconnect()
            embedObserver.disconnect()

            layout.set('CEToolbar')(false)
        }
    }, [])

    return $('div', {
        ref: rootRef,
        css: { overflow: 'hidden', padding: '8px' },
    })($(EditorJS, { ...props, autofocus: true, onReady, customTools })())
}
