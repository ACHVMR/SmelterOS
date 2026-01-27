/**
 * SmelterOS Firestore Client
 * Production-ready Firestore operations via REST API
 * 
 * NO MOCK CODE - All operations are real Firestore calls
 */

import { getAuthHeaders } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values: FirestoreValue[] };
  timestampValue?: string;
  nullValue?: null;
  geoPointValue?: { latitude: number; longitude: number };
  referenceValue?: string;
};

export interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

export interface QueryFilter {
  field: string;
  op: 'EQUAL' | 'NOT_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 
      'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'ARRAY_CONTAINS' |
      'ARRAY_CONTAINS_ANY' | 'IN' | 'NOT_IN';
  value: unknown;
}

export interface QueryOrder {
  field: string;
  direction: 'ASCENDING' | 'DESCENDING';
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: QueryOrder[];
  limit?: number;
  offset?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VALUE CONVERTERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convert JavaScript value to Firestore REST API format
 */
export function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) 
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return { 
      arrayValue: { 
        values: value.map(v => toFirestoreValue(v)) 
      } 
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Convert Firestore REST API value to JavaScript
 */
export function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue!, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return new Date(value.timestampValue!);
  if ('nullValue' in value) return null;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('referenceValue' in value) return value.referenceValue;
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

/**
 * Convert a plain object to Firestore fields format
 */
export function objectToFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'id') { // id is stored in document path, not fields
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

/**
 * Convert Firestore document to plain object
 */
export function documentToObject<T>(doc: FirestoreDocument): T {
  const id = doc.name.split('/').pop()!;
  const result: Record<string, unknown> = { id };
  
  for (const [key, value] of Object.entries(doc.fields || {})) {
    result[key] = fromFirestoreValue(value);
  }
  
  return result as T;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIRESTORE CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class ProductionFirestoreClient {
  private projectId: string;
  private baseUrl: string;

  constructor() {
    this.projectId = GCP_PROJECT.projectId;
    
    // Check for emulator
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    if (emulatorHost) {
      this.baseUrl = `http://${emulatorHost}/v1/projects/${this.projectId}/databases/(default)/documents`;
    } else {
      this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }
  }

  /**
   * Get a single document by collection and ID
   */
  async getDocument<T extends { id: string }>(
    collection: string, 
    docId: string
  ): Promise<T | null> {
    try {
      const headers = await getAuthHeaders();
      const url = `${this.baseUrl}/${collection}/${docId}`;
      
      const response = await fetch(url, { headers });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Firestore GET failed: ${response.status} ${await response.text()}`);
      }

      const doc = await response.json() as FirestoreDocument;
      return documentToObject<T>(doc);
    } catch (error) {
      console.error(`[Firestore] getDocument error (${collection}/${docId}):`, error);
      throw error;
    }
  }

  /**
   * Create or update a document
   */
  async setDocument<T extends { id: string }>(
    collection: string,
    docId: string,
    data: T,
    merge: boolean = false
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const url = `${this.baseUrl}/${collection}/${docId}`;
      const fields = objectToFields(data as unknown as Record<string, unknown>);

      // Use PATCH for merge, or PATCH with no mask for overwrite
      const method = 'PATCH';
      const body = JSON.stringify({ fields });

      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Firestore SET failed: ${response.status} ${await response.text()}`);
      }
    } catch (error) {
      console.error(`[Firestore] setDocument error (${collection}/${docId}):`, error);
      throw error;
    }
  }

  /**
   * Update specific fields in a document
   */
  async updateDocument<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const fields = objectToFields(updates as Record<string, unknown>);
      const fieldMask = Object.keys(updates).filter(k => k !== 'id').join(',');
      
      const url = `${this.baseUrl}/${collection}/${docId}?updateMask.fieldPaths=${fieldMask}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error(`Firestore UPDATE failed: ${response.status} ${await response.text()}`);
      }
    } catch (error) {
      console.error(`[Firestore] updateDocument error (${collection}/${docId}):`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collection: string, docId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const url = `${this.baseUrl}/${collection}/${docId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`Firestore DELETE failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`[Firestore] deleteDocument error (${collection}/${docId}):`, error);
      throw error;
    }
  }

  /**
   * Run a structured query
   */
  async query<T extends { id: string }>(
    collection: string,
    options: QueryOptions = {}
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    try {
      const headers = await getAuthHeaders();
      
      // Build structured query
      const structuredQuery: Record<string, unknown> = {
        from: [{ collectionId: collection }],
      };

      // Add filters
      if (options.filters && options.filters.length > 0) {
        if (options.filters.length === 1) {
          const f = options.filters[0];
          structuredQuery.where = {
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: toFirestoreValue(f.value),
            },
          };
        } else {
          structuredQuery.where = {
            compositeFilter: {
              op: 'AND',
              filters: options.filters.map(f => ({
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

      // Add ordering
      if (options.orderBy && options.orderBy.length > 0) {
        structuredQuery.orderBy = options.orderBy.map(o => ({
          field: { fieldPath: o.field },
          direction: o.direction,
        }));
      }

      // Add limit
      if (options.limit) {
        structuredQuery.limit = options.limit + 1; // +1 to check hasMore
      }

      // Add offset
      if (options.offset) {
        structuredQuery.offset = options.offset;
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
        throw new Error(`Firestore QUERY failed: ${response.status} ${await response.text()}`);
      }

      const results = await response.json() as Array<{ 
        document?: FirestoreDocument;
        readTime?: string;
      }>;

      const documents = results
        .filter(r => r.document)
        .map(r => documentToObject<T>(r.document!));

      // Check if there are more results
      const hasMore = options.limit ? documents.length > options.limit : false;
      const data = hasMore ? documents.slice(0, options.limit) : documents;

      return {
        data,
        total: data.length, // Note: Firestore doesn't give total count without counting query
        hasMore,
      };
    } catch (error) {
      console.error(`[Firestore] query error (${collection}):`, error);
      throw error;
    }
  }

  /**
   * Batch write multiple documents
   */
  async batchWrite(
    writes: Array<{
      operation: 'create' | 'update' | 'delete';
      collection: string;
      docId: string;
      data?: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const batchUrl = this.baseUrl.replace('/documents', ':batchWrite');

      const writeRequests = writes.map(w => {
        const docPath = `projects/${this.projectId}/databases/(default)/documents/${w.collection}/${w.docId}`;
        
        if (w.operation === 'delete') {
          return { delete: docPath };
        }
        
        return {
          update: {
            name: docPath,
            fields: objectToFields(w.data || {}),
          },
        };
      });

      const response = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes: writeRequests }),
      });

      if (!response.ok) {
        throw new Error(`Firestore BATCH_WRITE failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[Firestore] batchWrite error:', error);
      throw error;
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let firestoreClientInstance: ProductionFirestoreClient | null = null;

export function getFirestoreClient(): ProductionFirestoreClient {
  if (!firestoreClientInstance) {
    firestoreClientInstance = new ProductionFirestoreClient();
  }
  return firestoreClientInstance;
}
