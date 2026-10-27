/**
 * GLEIS Local Evidence Storage Vault (IndexedDB)
 * Stores full-size original audio recordings and document files in the browser's
 * IndexedDB storage (supporting hundreds of megabytes without localStorage quota limits),
 * allowing offline playback and preserving original evidence across page reloads.
 */

const DB_NAME = 'gleis_evidence_vault';
const STORE_NAME = 'evidence_blobs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryBlobCache = new Map<string, Blob>();
const activeUrlCache = new Map<string, string>();

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Stores an evidence audio or document file in the IndexedDB vault
 */
export async function storeEvidenceBlob(evidenceId: string, file: Blob | File): Promise<string> {
  memoryBlobCache.set(evidenceId, file);

  // Revoke previous object URL if any
  if (activeUrlCache.has(evidenceId)) {
    try {
      URL.revokeObjectURL(activeUrlCache.get(evidenceId)!);
    } catch {
      // ignore
    }
  }

  const url = URL.createObjectURL(file);
  activeUrlCache.set(evidenceId, url);

  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, evidenceId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not persist evidence blob to IndexedDB, using memory cache:', err);
  }

  return url;
}

/**
 * Retrieves the playable object URL for an evidence audio or document file
 */
export async function getEvidenceBlobUrl(evidenceId: string): Promise<string | null> {
  // Check memory cache first
  if (activeUrlCache.has(evidenceId)) {
    return activeUrlCache.get(evidenceId)!;
  }

  if (memoryBlobCache.has(evidenceId)) {
    const url = URL.createObjectURL(memoryBlobCache.get(evidenceId)!);
    activeUrlCache.set(evidenceId, url);
    return url;
  }

  try {
    const db = await getDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(evidenceId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      memoryBlobCache.set(evidenceId, blob);
      const url = URL.createObjectURL(blob);
      activeUrlCache.set(evidenceId, url);
      return url;
    }
  } catch (err) {
    console.warn('Could not read evidence blob from IndexedDB:', err);
  }

  return null;
}
