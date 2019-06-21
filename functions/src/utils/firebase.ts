import { createOnCallFn } from 'bluespark/dist/functions'
import admin from 'firebase-admin'
import { region } from 'firebase-functions'
import config from '../.config/default'
const serviceAccount = require('../.config/serviceAccountKey.json')

export const isDev = process.env.NODE_ENV !== 'production'

admin.initializeApp(
    isDev
        ? {
              credential: admin.credential.cert(serviceAccount),
              databaseURL: config.databaseURL,
          }
        : undefined,
)

export const db = admin.firestore()
export const bucket = admin.storage().bucket()
export const getRegion = () => region(...config.regions)
export const onCall = createOnCallFn(getRegion())
