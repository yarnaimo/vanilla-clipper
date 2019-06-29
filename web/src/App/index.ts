import { HookRouter, useRoutes } from 'hookrouter'
import { FC } from 'react'
import { $ } from 'tshx'
import { ArticleC } from './Article'
import { Main } from './Main'

const routes: HookRouter.RouteObject = {
    '/article/:id': ({ id }) => $(ArticleC, { id, embed: false })(),
    '*': () => $(Main, {})(),
}

type Props = {}

export const App: FC<Props> = props => {
    const route = useRoutes(routes)
    return route
}
