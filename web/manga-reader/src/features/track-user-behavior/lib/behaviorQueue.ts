import type { BehaviorEvent, BehaviorEventInput } from '@entities/behavior-event';
import { getStoredSession } from '@shared/service/session';

import { getBehaviorTrackingConfig, sendBehaviorEvents } from '../api/behaviorEvent.api';

const DATABASE = 'manga-reader-behavior';
const STORE = 'pending-events';
const SESSION_KEY = 'behavior:session-id';
const BATCH_SIZE = 100;
let flushing = false;
let flushRequested = false;
let retryDelay = 1_000;
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('behavior-events');

const sessionId = (): string => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
};

const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'eventId' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const transaction = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, mode);
        const request = operation(tx.objectStore(STORE));
        let result!: T;
        request.onsuccess = () => {
            result = request.result;
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => {
            database.close();
            resolve(result);
        };
        tx.onerror = () => {
            database.close();
            reject(tx.error);
        };
    });
};

export const flushBehaviorQueue = async (collectionAllowed?: boolean): Promise<void> => {
    if (flushing) {
        flushRequested = true;
        return;
    }
    if (!getStoredSession() || !navigator.onLine || typeof indexedDB === 'undefined') return;
    flushing = true;
    try {
        const enabled = collectionAllowed ?? (await getBehaviorTrackingConfig()).enabled;
        if (!enabled) {
            await transaction('readwrite', store => store.clear());
            return;
        }
        const pending = (await transaction('readonly', store => store.getAll(undefined, BATCH_SIZE))) as BehaviorEvent[];
        if (!pending.length) return;
        const acceptedIds = await sendBehaviorEvents(pending);
        if (acceptedIds.length) {
            const database = await openDatabase();
            await new Promise<void>((resolve, reject) => {
                const tx = database.transaction(STORE, 'readwrite');
                acceptedIds.forEach(id => tx.objectStore(STORE).delete(id));
                tx.oncomplete = () => {
                    database.close();
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            });
        }
        retryDelay = 1_000;
    } catch {
        const delay = retryDelay + Math.round(Math.random() * retryDelay * 0.25);
        retryDelay = Math.min(60_000, retryDelay * 2);
        window.setTimeout(() => void flushBehaviorQueue(), delay);
    } finally {
        flushing = false;
        if (flushRequested) {
            flushRequested = false;
            void flushBehaviorQueue();
        }
    }
};

export const trackBehavior = async (input: BehaviorEventInput): Promise<void> => {
    if (!getStoredSession() || typeof indexedDB === 'undefined') return;
    const config = await getBehaviorTrackingConfig().catch(() => null);
    if (!config?.enabled) return;
    const event: BehaviorEvent = {
        ...input,
        eventId: crypto.randomUUID(),
        sessionId: sessionId(),
        occurredAt: new Date().toISOString(),
        platform: 'WEB',
        appVersion: import.meta.env.VITE_APP_VERSION ?? 'web',
    };
    await transaction('readwrite', store => store.put(event));
    channel?.postMessage(event.eventId);
    void flushBehaviorQueue(true);
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void flushBehaviorQueue());
    channel?.addEventListener('message', () => void flushBehaviorQueue());
}
