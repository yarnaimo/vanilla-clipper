import { firestore } from 'firebase-functions'
import { browserTask } from '../../../src/models/browserTask'
import { db } from '../utils/firebase'

export const browserTaskUpdated = firestore
    .document('browserTasks/{id}')
    .onUpdate(async ({ before, after }) => {
        const [_before, _after] = [browserTask.ss(before), browserTask.ss(after)]
        if (!_before || !_after) {
            return
        }

        if (_before.status === 'waiting' && _after.status === 'processing') {
        }

        if (
            _before.status === 'processing' &&
            (_after.status === 'done' || _after.status === 'failed')
        ) {
            const {
                docs: [doc],
            } = await browserTask
                .within(db)
                .where('status', '==', 'waiting')
                .orderBy('createdAt', 'asc')
                .limit(1)
                .get()

            await doc.ref.update({ status: 'processing' })
        }
    })
