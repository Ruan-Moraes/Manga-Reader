export interface LocalDataParticipant {
    id: string;
    measureBytes: () => Promise<number>;
    clear: () => Promise<void>;
}

export interface LocalDataSummary {
    totalBytes: number;
    participantIds: string[];
}

const participants = new Map<string, LocalDataParticipant>();

export function registerLocalDataParticipant(participant: LocalDataParticipant): () => void {
    participants.set(participant.id, participant);
    return () => {
        if (participants.get(participant.id) === participant) participants.delete(participant.id);
    };
}

export async function measureLocalData(): Promise<LocalDataSummary> {
    const measured = await Promise.all(
        [...participants.values()].map(async participant => ({ id: participant.id, bytes: Math.max(0, await participant.measureBytes()) })),
    );
    const populated = measured.filter(item => item.bytes > 0);
    return {
        totalBytes: populated.reduce((total, item) => total + item.bytes, 0),
        participantIds: populated.map(item => item.id),
    };
}

export async function clearLocalData(participantIds: readonly string[]): Promise<void> {
    await Promise.all(
        participantIds.map(async id => {
            const participant = participants.get(id);
            if (participant) await participant.clear();
        }),
    );
}

export function resetLocalDataRegistryForTests(): void {
    participants.clear();
}
