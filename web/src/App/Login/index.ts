import { auth } from 'firebase/app'
import { FC } from 'react'
import { Button } from 'rmwc'
import { $ } from 'tshx'
import { authProvider } from '../../utils/firebase'

type Props = {}

export const Login: FC<Props> = props => {
    const login = () => {
        auth().signInWithPopup(authProvider)
    }

    return $(Button, {
        icon: 'exit_to_app',
        unelevated: true,
        onClick: login,
    })('ログイン')
}
