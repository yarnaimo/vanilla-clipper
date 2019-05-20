jest.setTimeout(30000)
import admin from 'firebase-admin'
import { storage } from './mocks/storage'

jest.spyOn(admin, 'storage' as any, 'get').mockImplementation(() => storage as any)
