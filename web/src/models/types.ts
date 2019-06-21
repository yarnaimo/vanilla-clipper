import { t } from 'bluespark'

export const stringOrNull = t.union([t.string, t.null])
export const stringOrUndefined = t.union([t.string, t.undefined])
