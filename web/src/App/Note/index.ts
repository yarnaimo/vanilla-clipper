import { navigate } from 'hookrouter'
import { FC } from 'react'
import { useDocumentOnce } from 'react-firebase-hooks/firestore'
import { $, $$ } from 'tshx'
import { Editor } from '../../components/Editor'
import { LoadingSpinner } from '../../components/LoadingSpinner'
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

    if (loading) {
        return $(LoadingSpinner, {})()
    }

    if (ss) {
        const note = Note.ss(ss)

        return $(Editor, { data: note ? (note.data as any) : undefined })()
    }

    return $$(error ? error.toString() : '')
}
