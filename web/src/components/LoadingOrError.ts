import { FC, ReactNode, useCallback } from 'react'
import { $ } from 'tshx'
import { Container } from './Container'
import { LoadingSpinner } from './LoadingSpinner'
import { Section } from './Section'

type Props = {
    loading: boolean
    error: {} | void
}

export const LoadingOrError: FC<Props> = props => {
    const wrap = useCallback(
        (children: ReactNode) => $(Container, {})($(Section, {})(children)),
        [],
    )

    if (props.error) {
        return wrap($('p', {})(props.error && props.error.toString()))
    }

    if (props.loading) {
        return wrap($(LoadingSpinner, {})())
    }

    return null
}
