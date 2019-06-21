import { FC } from 'react'
import { CircularProgress } from 'rmwc'
import { $ } from 'tshx'
import { FlexColumn } from './Flex'

type Props = {}

export const LoadingSpinner: FC<Props> = props => {
    return $(FlexColumn, { alignItems: 'center' })(
        $(CircularProgress as any, {
            size: 'large',
            theme: 'secondary',
        })(),
    )
}
