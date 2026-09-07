import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@ui/Composer', () => ({
    // Espelha o comportamento real do Composer: engole o erro do onSubmit
    // (mantém o conteúdo para o usuário tentar de novo), quem mostra o toast
    // de erro é o interceptor Axios global.
    Composer: ({ onSubmit }: { onSubmit: (textContent: string | null, imageContent: string | null) => void | Promise<void> }) => (
        <button
            type="button"
            onClick={() => {
                void Promise.resolve(onSubmit('Novo comentário', null)).catch(() => {});
            }}
        >
            submit
        </button>
    ),
}));

vi.mock('@shared/service/util/requireAuth', () => ({
    requireAuth: vi.fn(() => true),
}));

vi.mock('@shared/service/util/toastService', () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

vi.mock('@entities/comment', () => ({
    createComment: vi.fn(),
}));

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import { createComment } from '@entities/comment';

import CommentInput from '../CommentInput';

describe('CommentInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra toast de sucesso e chama onCommentCreated quando a API responde ok', async () => {
        vi.mocked(createComment).mockResolvedValue({} as never);
        const onCommentCreated = vi.fn();

        render(<CommentInput placeholder="..." targetId="t1" targetType="TITLE" onCommentCreated={onCommentCreated} />);

        fireEvent.click(screen.getByText('submit'));

        await waitFor(() => expect(onCommentCreated).toHaveBeenCalled());
        expect(showSuccessToast).toHaveBeenCalledWith('Comentário enviado com sucesso.', expect.objectContaining({ toastId: 'create-comment-success' }));
    });

    it('nao dispara toast de erro local quando a API falha (delegado ao interceptor Axios)', async () => {
        vi.mocked(createComment).mockRejectedValue(new Error('network error'));

        render(<CommentInput placeholder="..." targetId="t1" targetType="TITLE" />);

        fireEvent.click(screen.getByText('submit'));

        await waitFor(() => expect(createComment).toHaveBeenCalled());

        // O toast de erro fixo local não deve mais ser disparado — o interceptor
        // Axios (httpInterceptors.ts) já mostra a mensagem real do backend.
        expect(showErrorToast).not.toHaveBeenCalledWith('Erro ao enviar comentário.', expect.anything());
    });
});
