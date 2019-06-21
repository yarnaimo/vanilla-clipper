import { BrowserTask } from '../../../web/src/models/browserTask'
import { savePage } from '../core/savePage'
import { db, getRegion } from '../utils/firebase'

export const browserTaskUpdated = getRegion()
    .firestore.document('browserTasks/{id}')
    .onUpdate(async ({ before, after }) => {
        const [_before, _after] = [
            BrowserTask.ss(before),
            BrowserTask.ss(after),
        ]
        if (!_before || !_after) {
            return
        }

        if (_before.status === 'waiting' && _after.status === 'processing') {
            try {
                await savePage(after.id, _after)
                await after.ref.update({ status: 'done' })
            } catch (error) {
                await after.ref.update({ status: 'failed' })
            }
        }

        if (
            _before.status === 'processing' &&
            (_after.status === 'done' || _after.status === 'failed')
        ) {
            const waitingTasksQuery = BrowserTask.within(db)
                .where('status', '==', 'waiting')
                .orderBy('createdAt', 'asc')
                .limit(1)

            await db.runTransaction(async t => {
                const {
                    docs: [doc],
                } = await t.get(waitingTasksQuery)

                if (doc) {
                    await doc.ref.update({ status: 'processing' })
                }
            })
        }
    })
