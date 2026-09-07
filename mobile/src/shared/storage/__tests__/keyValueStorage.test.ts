import * as SecureStore from 'expo-secure-store';

import { readJson, secureKeyValueStorage, writeJson } from '../keyValueStorage';

const secureStore = jest.mocked(SecureStore);

describe('MOB-FEAT-001 secure key-value storage', () => {
    beforeEach(() => {
        secureStore.getItemAsync.mockReset();
        secureStore.setItemAsync.mockReset();
    });

    it('serializa e desserializa JSON sem conhecer chaves de domínio', async () => {
        secureStore.getItemAsync.mockResolvedValue('{"version":1}');
        secureStore.setItemAsync.mockResolvedValue();

        await expect(readJson(secureKeyValueStorage, 'example')).resolves.toEqual({ version: 1 });
        await writeJson(secureKeyValueStorage, 'example', { version: 1 });

        expect(secureStore.setItemAsync).toHaveBeenCalledWith('example', '{"version":1}');
    });

    it('propaga JSON inválido para a camada de domínio aplicar fallback', async () => {
        secureStore.getItemAsync.mockResolvedValue('{invalid');

        await expect(readJson(secureKeyValueStorage, 'example')).rejects.toBeInstanceOf(SyntaxError);
    });
});
