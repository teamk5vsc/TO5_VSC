export interface ExtractedPage {
  pageNum: number;
  text: string;
}

export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'txt';
  pageCount: number;
  uploadedAt: string;
  sizeBytes: number;
}

export interface KnowledgeDocument extends DocumentMetadata {
  pages: ExtractedPage[];
}

const DB_NAME = 'MathExplorerKnowledgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'document_contents';
const METADATA_KEY = 'math_explorer_kb_docs';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save document pages to IndexedDB
async function savePages(id: string, pages: ExtractedPage[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, pages });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get document pages from IndexedDB
export async function getDocumentPages(id: string): Promise<ExtractedPage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.pages : []);
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete document pages from IndexedDB
async function deletePages(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all document metadata from localStorage
export function getDocumentsMetadata(): DocumentMetadata[] {
  try {
    const stored = localStorage.getItem(METADATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Error reading metadata from localStorage:', err);
    return [];
  }
}

// Save all document metadata to localStorage
function saveDocumentsMetadata(metadata: DocumentMetadata[]): void {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (err) {
    console.error('Error writing metadata to localStorage:', err);
  }
}

// Add a document to metadata and IndexedDB
export async function addDocument(
  fileName: string,
  fileType: 'pdf' | 'txt',
  sizeBytes: number,
  pageCount: number,
  pages: ExtractedPage[]
): Promise<DocumentMetadata> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const uploadedAt = new Date().toISOString();

  const newMeta: DocumentMetadata = {
    id,
    fileName,
    fileType,
    pageCount,
    uploadedAt,
    sizeBytes,
  };

  // 1. Save text pages to IndexedDB
  await savePages(id, pages);

  // 2. Save metadata to localStorage
  const currentMetaList = getDocumentsMetadata();
  currentMetaList.push(newMeta);
  saveDocumentsMetadata(currentMetaList);

  return newMeta;
}

// Delete a document from metadata and IndexedDB
export async function deleteDocument(id: string): Promise<void> {
  // 1. Delete from IndexedDB
  await deletePages(id);

  // 2. Delete from localStorage metadata
  const currentMetaList = getDocumentsMetadata();
  const updatedList = currentMetaList.filter((doc) => doc.id !== id);
  saveDocumentsMetadata(updatedList);
}

// Compile context from all documents for the AI prompt
export async function compileContextForChat(): Promise<string> {
  const docs = getDocumentsMetadata();
  if (docs.length === 0) {
    return 'No documents uploaded yet.';
  }

  let fullContext = '';
  for (const doc of docs) {
    const pages = await getDocumentPages(doc.id);
    fullContext += `=== START OF DOCUMENT: ${doc.fileName} ===\n`;
    for (const page of pages) {
      fullContext += `[Source: ${doc.fileName}, Page: ${page.pageNum}]\n${page.text}\n\n`;
    }
    fullContext += `=== END OF DOCUMENT: ${doc.fileName} ===\n\n`;
  }

  return fullContext;
}
