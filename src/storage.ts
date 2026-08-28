export interface SavedWorkspace {
  image: Blob;
  name: string;
  width: number;
  height: number;
  columns: number;
  rows: number;
  frames: unknown[] | null;
  selected: number;
  effect: string;
  amount: number;
  color: string;
  savedAt: number;
}

const DB_NAME = 'frame-uv-lab';
const STORE = 'workspace';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorkspace(workspace: SavedWorkspace): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(workspace, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadWorkspace(): Promise<SavedWorkspace | null> {
  const db = await openDatabase();
  const result = await new Promise<SavedWorkspace | null>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get('current');
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
