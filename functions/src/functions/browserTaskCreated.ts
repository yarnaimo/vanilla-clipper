import { firestore } from 'firebase-functions'
import { browserTask } from '../../../src/models/browserTask'
import { db } from '../utils/firebase'

export const browserTaskCreated = firestore
    .document('browserTasks/{id}')
    .onCreate(async snapshot => {
        const task = browserTask.ss(snapshot)
        if (!task || task.status !== 'waiting') {
            return
        }

        const runningTasksQuery = browserTask.within(db).where('status', '==', 'processing')

        await db.runTransaction(async t => {
            const { size } = await t.get(runningTasksQuery)

            if (size === 0) {
                await t.update(snapshot.ref, { status: 'processing' })
            }
        })
    })
