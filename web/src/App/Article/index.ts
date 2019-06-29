import { FC, useMemo } from 'react'
import { useDocumentOnce } from 'react-firebase-hooks/firestore'
import { $ } from 'tshx'
import { LoadingOrError } from '../../components/LoadingOrError'
import { Article } from '../../models/article'
import { db } from '../../utils/firebase'

type Props = { id: string; embed: boolean }

export const ArticleC: FC<Props> = ({ id }) => {
    const [ss, loading, error] = useDocumentOnce(Article.within(db).doc(id))
    const article = useMemo(() => ss && Article.ss(ss), [ss])

    if (loading || error) {
        return $(LoadingOrError, { loading, error })()
    }

    if (!article) {
        return null
    }

    if (article.type === 'tweetCompact') {
        $('div', {
            css: {
                display: 'grid',
                gridTemplate: '24px 1fr 1fr 1fr / 40px 1fr',
                gridGap: '8px 12px',
            },
        })(
            $('div', { gridArea: '1/1 / 5/2' })(),
            $('div', { gridArea: '1/2 / 2/3' })(),
            $('div', { gridArea: '2/2 / 3/3' })(),
            $('div', { gridArea: '3/2 / 4/3' })(),
            $('div', { gridArea: '4/2 / 5/3' })(),
        )
    }

    return $('div', {})()
}
