import 'material-components-web/dist/material-components-web.min.css'
import 'react'
import { render } from 'react-dom'
import { ThemeProvider } from 'rmwc'
import { $ } from 'tshx'
import { App } from './App'
import './index.scss'
import * as serviceWorker from './serviceWorker'
import { Container } from './Store'
import { theme } from './utils/color'

render(
    $(Container, {})(
        $(ThemeProvider, {
            options: theme,
        })($(App, {})()),
    ),
    document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
