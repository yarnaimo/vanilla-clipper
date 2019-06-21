import { FC } from 'react'
import { $ } from 'tshx'

type Props = {}

export const Section: FC<Props> = props => {
    return $('section', { css: { margin: '1em 0' } })(props.children)
}
