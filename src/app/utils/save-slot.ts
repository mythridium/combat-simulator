import { Global } from 'src/app/global';

export interface SaveSlotData {
    index: number;
    name: string;
    data: string;
}

export abstract class SaveSlot {
    private static DB_NAME = 'mcs';
    private static db: IDBDatabase;

    public static async init() {
        const request = indexedDB.open(this.DB_NAME, 1);

        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.createObjectStore('saveSlots', { keyPath: 'id' });
        };

        await this.toPromise(request);

        this.db = request.result;
    }

    public static async save(key: string, data: SaveSlotData) {
        if (!this.db) {
            Global.logger.error('Cannot save as indexeddb failed to load.');
            return;
        }

        try {
            const store = this.db.transaction(['saveSlots'], 'readwrite').objectStore('saveSlots');
            const value = { id: key, data };

            await this.toPromise(store.put(value));
        } catch (error) {
            Global.logger.error('Failed to save save slot', error, key, data);
        }
    }

    public static async get(key: string) {
        if (!this.db) {
            Global.logger.error('Cannot get as indexeddb failed to load.');
            return;
        }

        try {
            const store = this.db.transaction(['saveSlots'], 'readwrite').objectStore('saveSlots');
            const result = await this.toPromise(store.get(key));

            if (!result) {
                return null;
            }

            return result.data;
        } catch (error) {
            Global.logger.error('Failed to load save slot', error, key);
            return null;
        }
    }

    private static toPromise<TResult>(request: IDBRequest<TResult>) {
        return new Promise<TResult>((resolve, reject) => {
            request.onsuccess = event => resolve((event.target as IDBRequest<TResult>).result);
            request.onerror = reject;
        });
    }
}
