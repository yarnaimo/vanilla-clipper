import { BrowserTask } from '../../../web/src/models/browserTask'
import { db, getRegion } from '../utils/firebase'

export const browserTaskCreated = getRegion()
    .firestore.document('browserTasks/{id}')
    .onCreate(async snapshot => {
        const task = BrowserTask.ss(snapshot)
        if (!task || task.status !== 'waiting') {
            return
        }

        const runningTasksQuery = BrowserTask.within(db).where(
            'status',
            '==',
            'processing',
        )

        await db.runTransaction(async t => {
            const { size } = await t.get(runningTasksQuery)

            if (size === 0) {
                await t.update(snapshot.ref, { status: 'processing' })
            }
        })
    })
