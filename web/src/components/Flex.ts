import { ObjectInterpolation } from '@emotion/css'
import { FC, ReactHTML } from 'react'
import { $ } from 'tshx'

type Props = ObjectInterpolation<any> & { tag?: keyof ReactHTML }

export const FlexColumn: FC<Props> = ({ tag, children, ...css }) => {
    return $(tag || 'div', {
        css: { display: 'flex', flexDirection: 'column', ...css },
    })(children)
}

export const FlexRow: FC<Props> = ({ tag, children, ...css }) => {
    return $(tag || 'div', {
        css: { display: 'flex', flexDirection: 'row', ...css },
    })(children)
}
