import styled from '@emotion/styled'
import { urlToTweetId } from '@yarnaimo/twimo'
import { useQueryParams } from 'hookrouter'
import isUrl from 'is-url'
import { FC, useCallback, useEffect } from 'react'
import { List, SimpleListItem } from 'rmwc'
import { $, $$ } from 'tshx'
import { ActionBox } from '../../components/ActionBox'
import { Container } from '../../components/Container'
import { useComputed } from '../../utils/hooks'

const ListItem = styled(SimpleListItem)({ padding: '0 22px' })

type Props = {}

export const Home: FC<Props> = props => {
    const [queryParams, setQueryParams] = useQueryParams()

    const [inputBufferC, setInputBuffer] = useComputed(
        value => ({
            value,
            isUrl: isUrl(value),
            tweetId: urlToTweetId(value),
        }),
        (queryParams.input as string) || '',
    )

    const emitInput = useCallback(
        () => setQueryParams({ input: inputBufferC.value }),
        [inputBufferC.value],
    )

    const li = (icon: string, text: string) =>
        $(ListItem, {
            graphic: icon,
            text: $('div', {})(text),
        })()

    useEffect(() => {
        console.log('aaa')
    }, [queryParams.input])

    const actionList = $(List, {})(
        inputBufferC.isUrl && li('web', '通常モードで保存'),
        inputBufferC.isUrl && li('notes', 'コンパクトモードで保存'),
        inputBufferC.tweetId && li('chat', 'ツイートを保存'),
    )

    return $$(
        $('div', {
            css: {
                position: 'fixed',
                zIndex: 10,
                top: 0,
                left: 0,
                width: '100%',
                paddingTop: 12,
            },
        })(
            $(Container, {})(
                $(ActionBox, {
                    placeholder: '検索または新しいページを保存',
                    inputBuffer: inputBufferC.value,
                    setInputBuffer,
                    emitInput,
                })(),
            ),
        ),
        $('div', { css: { paddingTop: 48 + 12 + 2 } })(),

        $(Container, {})(actionList),

        $('div', { css: { lineHeight: 100 } })('test'),
    )
}
