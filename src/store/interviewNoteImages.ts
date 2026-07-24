export type InterviewNoteImage = {
  id: string;
  questionId: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
};

const databaseName = "ta-interview-note-images";
const storeName = "images";
const databaseVersion = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        const store = database.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("questionId", "questionId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开截图存储"));
  });
}

function waitForTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("截图存储失败"));
    transaction.onabort = () => reject(transaction.error ?? new Error("截图存储已取消"));
  });
}

export async function listInterviewNoteImages(questionId: string) {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).index("questionId").getAll(questionId);
    const images = await new Promise<InterviewNoteImage[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as InterviewNoteImage[]);
      request.onerror = () => reject(request.error ?? new Error("无法读取截图"));
    });
    return images.sort((a, b) => a.createdAt - b.createdAt);
  } finally {
    database.close();
  }
}

export async function saveInterviewNoteImage(questionId: string, file: File) {
  const image: InterviewNoteImage = {
    id: `${questionId}-${crypto.randomUUID()}`,
    questionId,
    name: file.name || `截图-${new Date().toLocaleString("zh-CN")}`,
    type: file.type,
    blob: file,
    createdAt: Date.now(),
  };
  const database = await openDatabase();

  try {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(image);
    await waitForTransaction(transaction);
    return image;
  } finally {
    database.close();
  }
}

export async function deleteInterviewNoteImage(imageId: string) {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(imageId);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}
