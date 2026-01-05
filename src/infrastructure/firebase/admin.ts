/**
 * SmelterOS Firebase Admin SDK Integration
 * Server-side Firebase access for Cloud Run / Node.js
 * 
 * @module infrastructure/firebase/admin
 */

import { GCP_PROJECT } from '../gcp/config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims?: Record<string, unknown>;
}

export interface DecodedIdToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
  auth_time: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: `${GCP_PROJECT.projectId}.firebaseapp.com`,
  projectId: GCP_PROJECT.projectId,
  storageBucket: `${GCP_PROJECT.projectId}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || GCP_PROJECT.projectNumber,
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

export const EMULATOR_CONFIG = {
  auth: { host: 'localhost', port: 9099 },
  firestore: { host: 'localhost', port: 8080 },
  storage: { host: 'localhost', port: 9199 },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIREBASE ADMIN CLIENT (REST API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { getAccessToken, getAuthHeaders } from '../gcp/auth';

export class FirebaseAdminClient {
  private projectId: string;
  private initialized: boolean = false;

  constructor() {
    this.projectId = GCP_PROJECT.projectId;
  }

  /**
   * Check if running in emulator mode
   */
  isEmulatorMode(): boolean {
    return process.env.FIREBASE_EMULATOR === 'true' || 
           process.env.FIRESTORE_EMULATOR_HOST !== undefined;
  }

  /**
   * Get Firestore base URL
   */
  private getFirestoreUrl(): string {
    if (this.isEmulatorMode()) {
      return `http://${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}/v1/projects/${this.projectId}/databases/(default)/documents`;
    }
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  /**
   * Get Auth base URL
   */
  private getAuthUrl(): string {
    if (this.isEmulatorMode()) {
      return `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}/identitytoolkit.googleapis.com/v1`;
    }
    return 'https://identitytoolkit.googleapis.com/v1';
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    // For emulator mode, decode without verification
    if (this.isEmulatorMode()) {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload as DecodedIdToken;
    }

    // Production: Verify with Google's public keys
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const tokenInfo = await response.json() as Record<string, string>;

    // Validate issuer
    const validIssuers = [
      'https://accounts.google.com',
      'accounts.google.com',
      `https://securetoken.google.com/${this.projectId}`
    ];

    if (!validIssuers.includes(tokenInfo.iss)) {
      throw new Error('Invalid token issuer');
    }

    // Check expiration
    const expTime = parseInt(tokenInfo.exp, 10) * 1000;
    if (Date.now() > expTime) {
      throw new Error('Token expired');
    }

    return {
      uid: tokenInfo.sub,
      email: tokenInfo.email,
      email_verified: tokenInfo.email_verified === 'true',
      name: tokenInfo.name,
      picture: tokenInfo.picture,
      iat: parseInt(tokenInfo.iat, 10),
      exp: parseInt(tokenInfo.exp, 10),
      aud: tokenInfo.aud,
      iss: tokenInfo.iss,
      sub: tokenInfo.sub,
      auth_time: parseInt(tokenInfo.auth_time || tokenInfo.iat, 10),
    };
  }

  /**
   * Get user by UID
   */
  async getUser(uid: string): Promise<FirebaseUser | null> {
    try {
      const headers = await getAuthHeaders();
      const url = `${this.getAuthUrl()}/accounts:lookup?key=${FIREBASE_CONFIG.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localId: [uid] }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as { users?: Array<Record<string, unknown>> };
      const user = data.users?.[0];
      
      if (!user) {
        return null;
      }

      return {
        uid: user.localId as string,
        email: user.email as string | null,
        displayName: user.displayName as string | null,
        photoURL: user.photoUrl as string | null,
        emailVerified: user.emailVerified as boolean || false,
        disabled: user.disabled as boolean || false,
        metadata: {
          creationTime: user.createdAt as string || '',
          lastSignInTime: user.lastLoginAt as string || '',
        },
        customClaims: user.customAttributes ? JSON.parse(user.customAttributes as string) : undefined,
      };
    } catch (error) {
      console.error('[Firebase] Get user error:', error);
      return null;
    }
  }

  /**
   * Create custom claims for a user
   */
  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    const headers = await getAuthHeaders();
    const url = `${this.getAuthUrl()}/accounts:update?key=${FIREBASE_CONFIG.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify(claims),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set custom claims: ${response.status}`);
    }
  }

  /**
   * Disable a user account
   */
  async disableUser(uid: string): Promise<void> {
    const headers = await getAuthHeaders();
    const url = `${this.getAuthUrl()}/accounts:update?key=${FIREBASE_CONFIG.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: uid,
        disableUser: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to disable user: ${response.status}`);
    }
  }

  /**
   * Delete a user account
   */
  async deleteUser(uid: string): Promise<void> {
    const headers = await getAuthHeaders();
    const url = `${this.getAuthUrl()}/accounts:delete?key=${FIREBASE_CONFIG.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIRESTORE CLIENT (Production)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values: FirestoreValue[] };
  timestampValue?: string;
  nullValue?: null;
};

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) 
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue!, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return new Date(value.timestampValue!);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    return value.arrayValue?.values?.map(fromFirestoreValue) || [];
  }
  if ('mapValue' in value) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue?.fields || {})) {
      result[k] = fromFirestoreValue(v);
    }
    return result;
  }
  return null;
}

export class FirestoreClient {
  private projectId: string;
  private baseUrl: string;

  constructor() {
    this.projectId = GCP_PROJECT.projectId;
    const isEmulator = process.env.FIRESTORE_EMULATOR_HOST !== undefined;
    this.baseUrl = isEmulator
      ? `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${this.projectId}/databases/(default)/documents`
      : `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  /**
   * Get a document by path
   */
  async getDocument<T>(collection: string, docId: string): Promise<T | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${collection}/${docId}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Firestore get failed: ${response.status}`);
      }

      const doc = await response.json() as { fields: Record<string, FirestoreValue> };
      const result: Record<string, unknown> = { id: docId };
      
      for (const [key, value] of Object.entries(doc.fields || {})) {
        result[key] = fromFirestoreValue(value);
      }
      
      return result as T;
    } catch (error) {
      console.error('[Firestore] Get document error:', error);
      return null;
    }
  }

  /**
   * Set a document (create or overwrite)
   */
  async setDocument<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: T
  ): Promise<void> {
    const headers = await getAuthHeaders();
    const fields: Record<string, FirestoreValue> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id') {
        fields[key] = toFirestoreValue(value);
      }
    }

    const response = await fetch(`${this.baseUrl}/${collection}/${docId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Firestore set failed: ${response.status}`);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collection: string, docId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/${collection}/${docId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Firestore delete failed: ${response.status}`);
    }
  }

  /**
   * Query documents
   */
  async query<T>(
    collection: string,
    filters: Array<{ field: string; op: string; value: unknown }>,
    orderBy?: { field: string; direction: 'ASCENDING' | 'DESCENDING' },
    limit?: number
  ): Promise<T[]> {
    const headers = await getAuthHeaders();
    
    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId: collection }],
    };

    if (filters.length > 0) {
      if (filters.length === 1) {
        structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: filters[0].op,
            value: toFirestoreValue(filters[0].value),
          },
        };
      } else {
        structuredQuery.where = {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(f => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: toFirestoreValue(f.value),
              },
            })),
          },
        };
      }
    }

    if (orderBy) {
      structuredQuery.orderBy = [{
        field: { fieldPath: orderBy.field },
        direction: orderBy.direction,
      }];
    }

    if (limit) {
      structuredQuery.limit = limit;
    }

    const response = await fetch(`${this.baseUrl}:runQuery`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ structuredQuery }),
    });

    if (!response.ok) {
      throw new Error(`Firestore query failed: ${response.status}`);
    }

    const results = await response.json() as Array<{ document?: { name: string; fields: Record<string, FirestoreValue> } }>;
    
    return results
      .filter(r => r.document)
      .map(r => {
        const doc = r.document!;
        const id = doc.name.split('/').pop()!;
        const data: Record<string, unknown> = { id };
        
        for (const [key, value] of Object.entries(doc.fields || {})) {
          data[key] = fromFirestoreValue(value);
        }
        
        return data as T;
      });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLETON INSTANCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let firebaseAdminInstance: FirebaseAdminClient | null = null;
let firestoreInstance: FirestoreClient | null = null;

export function getFirebaseAdmin(): FirebaseAdminClient {
  if (!firebaseAdminInstance) {
    firebaseAdminInstance = new FirebaseAdminClient();
  }
  return firebaseAdminInstance;
}

export function getFirestore(): FirestoreClient {
  if (!firestoreInstance) {
    firestoreInstance = new FirestoreClient();
  }
  return firestoreInstance;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVENIENCE EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getFirebaseAdmin().verifyIdToken(idToken);
}

export async function getUserByUid(uid: string): Promise<FirebaseUser | null> {
  return getFirebaseAdmin().getUser(uid);
}

export async function setCustomUserClaims(
  uid: string,
  claims: Record<string, unknown>
): Promise<void> {
  return getFirebaseAdmin().setCustomClaims(uid, claims);
}
