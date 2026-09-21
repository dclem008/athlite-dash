import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// Define the strict TypeScript schema for our local browser database
interface AthliteLocalDB extends DBSchema {
  syncQueue: {
    key: number; // Auto-incrementing ID
    value: {
      id?: number;
      type: 'event' | 'goal'; // Tells the sync engine which backend route to hit
      payload: any;           // The actual JSON body to send
      timestamp: number;      // When it was logged locally
    };
    indexes: { 'by-timestamp': number };
  };
}

// Initialize the database
const dbPromise: Promise<IDBPDatabase<AthliteLocalDB>> = openDB<AthliteLocalDB>('athlite-offline-db', 1, {
  upgrade(db) {
    const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    store.createIndex('by-timestamp', 'timestamp');
  },
});

export const OfflineDB = {
  async addToQueue(type: 'event' | 'goal', payload: any) {
    const db = await dbPromise;
    await db.add('syncQueue', { type, payload, timestamp: Date.now() });
  },

  async getQueue() {
    const db = await dbPromise;
    // Retrieve oldest first so they sync in chronological order
    return db.getAllFromIndex('syncQueue', 'by-timestamp');
  },

  async removeFromQueue(id: number) {
    const db = await dbPromise;
    await db.delete('syncQueue', id);
  }
};