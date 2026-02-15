import { type UserSavedLibrary } from '@feature/library';

/**
 * Biblioteca salva do usuário demo.
 * Dados iniciais para o localStorage (seed).
 */
export const mockLibrary: UserSavedLibrary[] = [
    {
        userId: 'user-1',
        name: 'Leitor Demo',
        savedMangas: [
            {
                titleId: '1',
                name: 'Reino de Aço',
                cover: 'https://picsum.photos/300/450?random=101',
                type: 'Mangá',
                list: 'Lendo',
                savedAt: '2026-01-10T10:00:00.000Z',
            },
            {
                titleId: '2',
                name: 'Lâmina do Amanhã',
                cover: 'https://picsum.photos/300/450?random=102',
                type: 'Manhwa',
                list: 'Quero Ler',
                savedAt: '2026-01-17T12:00:00.000Z',
            },
            {
                titleId: '3',
                name: 'Flores de Neon',
                cover: 'https://picsum.photos/300/450?random=103',
                type: 'Mangá',
                list: 'Concluído',
                savedAt: '2026-01-20T14:00:00.000Z',
            },
            {
                titleId: '6',
                name: 'Sonata de Sangue',
                cover: 'https://picsum.photos/300/450?random=106',
                type: 'Mangá',
                list: 'Concluído',
                savedAt: '2025-12-15T09:00:00.000Z',
            },
            {
                titleId: '11',
                name: 'Solo Ascension',
                cover: 'https://picsum.photos/300/450?random=111',
                type: 'Manhwa',
                list: 'Lendo',
                savedAt: '2026-01-28T18:00:00.000Z',
            },
            {
                titleId: '8',
                name: 'Contrato Lunar',
                cover: 'https://picsum.photos/300/450?random=108',
                type: 'Mangá',
                list: 'Quero Ler',
                savedAt: '2026-02-05T11:30:00.000Z',
            },
        ],
    },
];
