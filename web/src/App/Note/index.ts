import { navigate } from 'hookrouter'
import { FC, useMemo } from 'react'
import { useDocumentOnce } from 'react-firebase-hooks/firestore'
import { $, $$ } from 'tshx'
import { Editor } from '../../components/Editor'
import { LoadingOrError } from '../../components/LoadingOrError'
import { Note } from '../../models/note'
import { db } from '../../utils/firebase'

type Props = {
    id: string
}

const notes = Note.within(db)

export const NoteC: FC<Props> = props => {
    if (props.id === 'new') {
        const docId = notes.doc().id
        navigate(`/notes/${docId}`)
        return $$()
    }

    return $(_Note, props)()
}

const _Note: FC<Props> = ({ id }) => {
    const [ss, loading, error] = useDocumentOnce(notes.doc(id))
    const note = useMemo(() => ss && Note.ss(ss), [ss])

    if (loading || error) {
        return $(LoadingOrError, { loading, error })()
    }

    return $(Editor, {
        data: note ? (note.data as any) : undefined,
    })()
}
