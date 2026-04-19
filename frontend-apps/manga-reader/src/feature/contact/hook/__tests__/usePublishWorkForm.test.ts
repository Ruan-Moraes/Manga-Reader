import { act } from '@testing-library/react';
import { renderHookWithProviders, seedAuthSession } from '@/test/testUtils';
import usePublishWorkForm from '../usePublishWorkForm';

vi.mock('@shared/service/util/toastService');

const submitEmpty = async (result: {
    current: ReturnType<typeof usePublishWorkForm>;
}) => {
    await act(async () => {
        const fakeEvent = {
            preventDefault: vi.fn(),
        } as unknown as React.FormEvent<HTMLFormElement>;

        await result.current.handleSubmit(fakeEvent);
    });
};

describe('usePublishWorkForm', () => {
    describe('pre-preenchimento', () => {
        it('deve pre-preencher nome e email da sessao do usuario', () => {
            seedAuthSession({ name: 'Ruan', email: 'ruan@test.com' });

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            expect(result.current.draft.name).toBe('Ruan');
            expect(result.current.draft.email).toBe('ruan@test.com');
        });

        it('deve iniciar com campos vazios quando nao ha sessao', () => {
            localStorage.clear();

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            expect(result.current.draft.name).toBe('');
            expect(result.current.draft.email).toBe('');
        });
    });

    describe('updateField', () => {
        it('deve atualizar campo do draft', () => {
            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('workTitle', 'Minha Obra');
            });

            expect(result.current.draft.workTitle).toBe('Minha Obra');
        });

        it('deve limpar erro do campo ao atualizar', async () => {
            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            await submitEmpty(result);

            expect(result.current.errors.workTitle).toBeDefined();

            act(() => {
                result.current.updateField('workTitle', 'Novo titulo');
            });

            expect(result.current.errors.workTitle).toBeUndefined();
        });
    });

    describe('validacao', () => {
        it('deve gerar erros para todos os campos obrigatorios vazios', async () => {
            localStorage.clear();

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            await submitEmpty(result);

            expect(result.current.errors.name).toBeDefined();
            expect(result.current.errors.email).toBeDefined();
            expect(result.current.errors.workType).toBeDefined();
            expect(result.current.errors.workTitle).toBeDefined();
            expect(result.current.errors.synopsis).toBeDefined();
            expect(result.current.errors.message).toBeDefined();
        });

        it('deve validar formato de email', async () => {
            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('email', 'email-invalido');
            });

            await submitEmpty(result);

            expect(result.current.errors.email).toContain('inválido');
        });

        it('deve validar URL do portfolio quando preenchido', async () => {
            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('portfolioLink', 'nao-e-url');
            });

            await submitEmpty(result);

            expect(result.current.errors.portfolioLink).toBeDefined();
        });

        it('deve aceitar portfolio link vazio (campo opcional)', async () => {
            seedAuthSession({ name: 'Ruan', email: 'ruan@test.com' });

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('workType', 'manga');
                result.current.updateField('workTitle', 'Minha Obra');
                result.current.updateField(
                    'synopsis',
                    'Uma sinopse interessante sobre a historia',
                );
                result.current.updateField(
                    'message',
                    'Gostaria de publicar meu trabalho aqui',
                );
            });

            await submitEmpty(result);

            expect(result.current.errors.portfolioLink).toBeUndefined();
        });

        it('deve validar tamanho minimo da sinopse', async () => {
            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('synopsis', 'Curta');
            });

            await submitEmpty(result);

            expect(result.current.errors.synopsis).toContain('10 caracteres');
        });
    });

    describe('submit com sucesso', () => {
        it('deve resetar formulario apos submit bem-sucedido', async () => {
            seedAuthSession({ name: 'Ruan', email: 'ruan@test.com' });

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('workType', 'manga');
                result.current.updateField('workTitle', 'Minha Obra');
                result.current.updateField(
                    'synopsis',
                    'Uma sinopse interessante sobre a historia',
                );
                result.current.updateField(
                    'message',
                    'Gostaria de publicar meu trabalho aqui',
                );
            });

            await submitEmpty(result);

            expect(result.current.errors).toEqual({});
            expect(result.current.draft.workType).toBe('');
            expect(result.current.draft.workTitle).toBe('');
            expect(result.current.draft.synopsis).toBe('');
            expect(result.current.draft.message).toBe('');
            expect(result.current.draft.name).toBe('Ruan');
            expect(result.current.draft.email).toBe('ruan@test.com');
        });

        it('deve setar isSubmitting como false apos completar', async () => {
            seedAuthSession({ name: 'Ruan', email: 'ruan@test.com' });

            const { result } = renderHookWithProviders(() =>
                usePublishWorkForm(),
            );

            act(() => {
                result.current.updateField('workType', 'manga');
                result.current.updateField('workTitle', 'Minha Obra');
                result.current.updateField(
                    'synopsis',
                    'Uma sinopse interessante sobre a historia',
                );
                result.current.updateField(
                    'message',
                    'Gostaria de publicar meu trabalho aqui',
                );
            });

            expect(result.current.isSubmitting).toBe(false);

            await submitEmpty(result);

            expect(result.current.isSubmitting).toBe(false);
        });
    });
});
