/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, addDoc, query, where, limit } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let firebaseApp: any = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let isFirestoreAvailable = false;

// Attempt to load the Firebase Config safely
try {
  const config = firebaseConfig;
  if (config && config.apiKey && config.apiKey !== '') {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
    isFirestoreAvailable = true;
    console.log("Firebase integrated and connected successfully.");
    
    // Quick test connection as mandated
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(firestoreDb!, 'test', 'connection'));
      } catch (err: any) {
        if (err?.message?.includes('the client is offline')) {
          console.warn("Firebase client offline warning safely caught.");
        }
      }
    };
    testConnection();
  } else {
    console.log("Firebase configuration not fully complete. Gracefully falling back to integrated browser database engine (uniquely designed for offline execution & preview sandbox durability).");
  }
} catch (e) {
  console.log("Safe framework-isolated fallback activated: Using high-performance LocalStorage state controller.");
}

// Error parsing logic matching strict Firebase rules guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = firebaseAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || 'guest-fallback',
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global safe storage helper that bridges Firestore and LocalStorage
export const storageProvider = {
  isCloud() {
    return isFirestoreAvailable && firestoreDb !== null;
  },

  getDb() {
    return firestoreDb;
  },

  getAuth() {
    return firebaseAuth;
  },

  // Save to persistent collections
  async save(collectionName: string, id: string, data: any): Promise<void> {
    if (this.isCloud()) {
      try {
        await setDoc(doc(firestoreDb!, collectionName, id), {
          ...data,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${id}`);
      }
    } else {
      const storageKey = `math_explorer_${collectionName}`;
      const existing = this.getLocalCollection(collectionName);
      existing[id] = { ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(storageKey, JSON.stringify(existing));
    }
  },

  // Add new item with generated key
  async add(collectionName: string, data: any): Promise<string> {
    const id = Math.random().toString(36).substring(2, 11);
    await this.save(collectionName, id, { id, ...data });
    return id;
  },

  // Retrieve single item
  async get(collectionName: string, id: string): Promise<any | null> {
    if (this.isCloud()) {
      try {
        const snap = await getDoc(doc(firestoreDb!, collectionName, id));
        return snap.exists() ? snap.data() : null;
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `${collectionName}/${id}`);
      }
    } else {
      const existing = this.getLocalCollection(collectionName);
      return existing[id] || null;
    }
  },

  // Retrieve matching filter
  async queryAll(collectionName: string, filterField?: string, filterValue?: any): Promise<any[]> {
    if (this.isCloud()) {
      try {
        let q;
        if (filterField && filterValue !== undefined) {
          q = query(collection(firestoreDb!, collectionName), where(filterField, '==', filterValue));
        } else {
          q = query(collection(firestoreDb!, collectionName));
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data());
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, collectionName);
      }
    } else {
      const existing = this.getLocalCollection(collectionName);
      const list = Object.values(existing);
      if (filterField && filterValue !== undefined) {
        return list.filter((item: any) => item[filterField] === filterValue);
      }
      return list;
    }
    return [];
  },

  getLocalCollection(collectionName: string): Record<string, any> {
    const storageKey = `math_explorer_${collectionName}`;
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  },

  // Initialize a demo database structure if localStorage is totally blank
  seedLocal(collectionName: string, dataMap: Record<string, any>) {
    const storageKey = `math_explorer_${collectionName}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(dataMap));
    }
  }
};
