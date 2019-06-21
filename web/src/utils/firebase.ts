import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { firebaseConfig } from '../.config/firebase'

firebase.initializeApp(firebaseConfig)

export const db = firebase.firestore()

export const functions = firebase.functions()

export const authProvider = new firebase.auth.GoogleAuthProvider()
