import admin from 'firebase-admin'
const serviceAccount = require('../.config/serviceAccountKey.json')

admin.initializeApp(
    serviceAccount
        ? {
              credential: admin.credential.cert(serviceAccount),
              databaseURL: 'https://frais-test.firebaseio.com',
          }
        : undefined,
)
const db = admin.firestore()
const bucket = admin.storage().bucket()

export { admin, db, bucket }
