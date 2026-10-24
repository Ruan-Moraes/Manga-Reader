import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { LocalTranslationLibraryItem, LocalTranslationResultRepository } from '@/entities/local-translation-result';
import type { RemoveLocalTranslationProjectController } from '@/features/local-translation';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { LocalTranslationLibrary } from '../LocalTranslationLibrary';

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const item: LocalTranslationLibraryItem = {
    project: {
        id: 'project-1',
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        status: 'READY',
        createdAt: 10,
        updatedAt: 20,
        statusUpdatedAt: 20,
        languageReviewRequired: false,
        pages: [
            {
                id: 'page-1',
                projectId: 'project-1',
                position: 0,
                originalFilename: 'original.jpg',
                originalByteSize: 25,
                originalMimeType: 'image/jpeg',
                widthPx: 800,
                heightPx: 1200,
                mediaValidatedAt: 10,
                mediaValidationPolicyVersion: 1,
                status: 'READY',
                createdAt: 10,
                updatedAt: 20,
                statusUpdatedAt: 20,
            },
        ],
    },
    readyPages: 1,
    currentPosition: 0,
    coverUri: 'file:///original.jpg',
    demo: true,
};

function repository(items: LocalTranslationLibraryItem[]): jest.Mocked<LocalTranslationResultRepository> {
    return {
        initialize: jest.fn().mockResolvedValue(undefined),
        saveDemoResults: jest.fn(),
        getByPage: jest.fn(),
        listByProject: jest.fn(),
        listLibrary: jest.fn().mockResolvedValue(items),
        markAutoOpened: jest.fn(),
        invalidate: jest.fn(),
        removeProject: jest.fn(),
        reconcileFiles: jest.fn(),
        measureBytes: jest.fn(),
        clear: jest.fn(),
    };
}

describe('MOB-FEAT-025 local translation library', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('shows local demo metadata and opens the selected project', async () => {
        const onOpen = jest.fn();
        render(
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationLibrary onOpen={onOpen} onCreate={jest.fn()} repository={repository([item])} />
            </ThemeProvider>,
        );

        expect(await screen.findByText('RESULTADO SIMULADO')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Abrir leitor' }));
        expect(onOpen).toHaveBeenCalledWith('project-1');
    });

    it('requires confirmation, removes the project and refreshes the list', async () => {
        const data = repository([item]);
        data.listLibrary.mockResolvedValueOnce([item]).mockResolvedValueOnce([]);
        const remove: RemoveLocalTranslationProjectController = { remove: jest.fn().mockResolvedValue(undefined) };
        const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => buttons?.[1]?.onPress?.());
        render(
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationLibrary onOpen={jest.fn()} onCreate={jest.fn()} repository={data} removeController={remove} />
            </ThemeProvider>,
        );

        fireEvent.press(await screen.findByRole('button', { name: 'Excluir' }));
        await waitFor(() => expect(remove.remove).toHaveBeenCalledWith('project-1'));
        expect(await screen.findByText('Sua biblioteca está vazia')).toBeOnTheScreen();
        alert.mockRestore();
    });
});
