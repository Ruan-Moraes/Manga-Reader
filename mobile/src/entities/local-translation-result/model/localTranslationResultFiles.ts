let tail: Promise<void> = Promise.resolve();

/** Keeps startup orphan reconciliation outside the promote/commit ownership window. */
export async function withLocalTranslationResultFiles<T>(work: () => Promise<T>): Promise<T> {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>(resolve => {
        release = resolve;
    });
    await previous;
    try {
        return await work();
    } finally {
        release();
    }
}
