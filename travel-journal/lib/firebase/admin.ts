import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function initAdminApp() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

let _db: Firestore | undefined;
let _auth: Auth | undefined;

// Lazy proxy: Firebase Admin is only initialized on the first actual request,
// not at module import time (which would fail during `next build`).
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) {
      initAdminApp();
      _db = getFirestore();
    }
    const value = (_db as any)[prop];
    return typeof value === 'function' ? value.bind(_db) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) {
      initAdminApp();
      _auth = getAuth();
    }
    const value = (_auth as any)[prop];
    return typeof value === 'function' ? value.bind(_auth) : value;
  },
});
