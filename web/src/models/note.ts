import { blue, DayjsFromFirestoreTimestamp, FieldValue, t, tt } from 'bluespark'
import { stringOrNull } from './types'

export const Note = blue(
    'notes',
    t.type({
        createdAt: t.union([DayjsFromFirestoreTimestamp, FieldValue]),
        updatedAt: t.union([DayjsFromFirestoreTimestamp, FieldValue]),
        title: t.string,
        icon: stringOrNull,
        words: t.array(t.string),
        data: tt.JSONFromString,
    }),
)
