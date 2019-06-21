import { EditorConfig } from '@editorjs/editorjs'
import { FC } from 'react'
import { $ } from 'tshx'
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
    onReady?: EditorConfig['onReady']
    data?: EditorConfig['data']
    autofocus?: EditorConfig['autofocus']
}

export const Editor: FC<Props> = props => {
    return $('div', { css: { overflow: 'hidden', padding: '8px' } })(
        $(EditorJS, { ...props, autofocus: true, customTools: {} })(),
    )
}
