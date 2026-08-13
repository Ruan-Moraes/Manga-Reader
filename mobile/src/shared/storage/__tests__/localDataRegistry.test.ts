import { clearLocalData, measureLocalData, registerLocalDataParticipant, resetLocalDataRegistryForTests } from '../localDataRegistry';

describe('MOB-FEAT-009 local data registry', () => {
    afterEach(resetLocalDataRegistryForTests);

    it('reporta estado vazio sem participante real', async () => {
        await expect(measureLocalData()).resolves.toEqual({ totalBytes: 0, participantIds: [] });
    });

    it('mede e limpa somente participantes com dados', async () => {
        const clear = jest.fn().mockResolvedValue(undefined);
        registerLocalDataParticipant({ id: 'translation-projects', measureBytes: async () => 42, clear });
        registerLocalDataParticipant({ id: 'empty', measureBytes: async () => 0, clear: jest.fn() });

        await expect(measureLocalData()).resolves.toEqual({ totalBytes: 42, participantIds: ['translation-projects'] });
        await clearLocalData(['translation-projects']);
        expect(clear).toHaveBeenCalledTimes(1);
    });
});
