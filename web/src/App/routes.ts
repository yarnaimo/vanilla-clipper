import { HookRouter } from 'hookrouter'
import { $ } from 'tshx'
import { Home } from './Home'
import { NoteC } from './Note'

export const routes: HookRouter.RouteObject = {
    '/': () => $(Home, {})(),

    '/notes/:id': ({ id }) => $(NoteC, { id })(),
}
