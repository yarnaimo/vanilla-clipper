import { EditorConfig, ToolSettings } from '@editorjs/editorjs'
import { Embed } from './Embed'
import { ImageTool } from './ImageTool'

const Header = require('@editorjs/header')
const List = require('@editorjs/list')
const InlineCode = require('@editorjs/inline-code')
// const ImageTool = require('@editorjs/image')
// const Embed = require('@editorjs/embed')
const Quote = require('@editorjs/quote')
const Marker = require('@editorjs/marker')
const Code = require('@editorjs/code')
const Link = require('@editorjs/link')
const Delimiter = require('@editorjs/delimiter')
const Raw = require('@editorjs/raw')
const Table = require('@editorjs/table')
const Warning = require('@editorjs/warning')
const Paragraph = require('@editorjs/paragraph')
const Checklist = require('@editorjs/checklist')

const withInlineToolbar = (_class: any): ToolSettings => ({
    class: _class,
    inlineToolbar: ['bold', 'inlineCode', 'marker'],
})

export const customTools: EditorConfig['tools'] = {
    header: Header,
    list: withInlineToolbar(List),
    image: ImageTool,
    inlineCode: InlineCode,
    embed: Embed,
    quote: withInlineToolbar(Quote),
    marker: Marker,
    code: Code,
    link: Link,
    delimiter: Delimiter,
    raw: Raw,
    table: withInlineToolbar(Table),
    warning: withInlineToolbar(Warning),
    paragraph: withInlineToolbar(Paragraph),
    checklist: withInlineToolbar(Checklist),
}
