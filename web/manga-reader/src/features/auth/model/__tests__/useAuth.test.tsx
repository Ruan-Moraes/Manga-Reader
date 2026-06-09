import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { mockAuthResponse } from '@/test/mocks/handlers';
import { seedAuthSession } from '@/test/testUtils';

import { AuthProvider } from '../AuthProvider';
import useAuth from '../useAuth';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const renderAuth = () => renderHook(() => useAuth(), { wrapper });

describe('useAuth', () => {
    // ── Estado inicial ────────────────────────────────────────────────────

    it('deve inicializar com user null quando não há sessão armazenada', () => {
        const { result } = renderAuth();

        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
    });

    it('deve carregar user do /me quando sessão existe no localStorage', async () => {
        seedAuthSession();

        const { result } = renderAuth();

        await waitFor(() => expect(result.current.user).not.toBeNull());

        expect(result.current.user?.id).toBe(mockAuthResponse.userId);
        expect(result.current.user?.name).toBe(mockAuthResponse.name);
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('deve definir user como null quando /me falha', async () => {
        seedAuthSession();

        server.use(
            http.get('*/api/auth/me', () => {
                return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
            }),
        );

        const { result } = renderAuth();

        // Aguarda o efeito mount processar e setar null
        await waitFor(() => {
            // O estado final após o catch deve ser null
            expect(result.current.user).toBeNull();
        });

        expect(result.current.isLoggedIn).toBe(false);
    });

    // ── Login ─────────────────────────────────────────────────────────────

    it('deve retornar user com role mapeado após login', async () => {
        const { result } = renderAuth();

        let loggedUser;
        await act(async () => {
            loggedUser = await result.current.login({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        expect(loggedUser).toBeDefined();
        expect(loggedUser!.role).toBe('user'); // MEMBER → user
        expect(result.current.user?.id).toBe(mockAuthResponse.userId);
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('deve persistir sessão no localStorage após login', async () => {
        const { result } = renderAuth();

        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        const stored = localStorage.getItem('manga-reader:auth-user');
        expect(stored).not.toBeNull();

        const parsed = JSON.parse(stored!);
        expect(parsed.accessToken).toBe(mockAuthResponse.accessToken);
    });

    it('deve lançar erro quando credenciais estão incorretas', async () => {
        server.use(
            http.post('*/api/auth/sign-in', () => {
                return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
            }),
        );

        const { result } = renderAuth();

        await expect(
            act(async () => {
                await result.current.login({
                    email: 'wrong@example.com',
                    password: 'wrong',
                });
            }),
        ).rejects.toThrow();
    });

    // ── Register ──────────────────────────────────────────────────────────

    it('deve retornar user após registro', async () => {
        const { result } = renderAuth();

        let registeredUser;
        await act(async () => {
            registeredUser = await result.current.register({
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
            });
        });

        expect(registeredUser).toBeDefined();
        expect(registeredUser!.name).toBe(mockAuthResponse.name);
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('deve lançar erro quando email já existe no registro', async () => {
        server.use(
            http.post('*/api/auth/sign-up', () => {
                return HttpResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
            }),
        );

        const { result } = renderAuth();

        await expect(
            act(async () => {
                await result.current.register({
                    name: 'Duplicate',
                    email: 'existing@example.com',
                    password: 'password123',
                });
            }),
        ).rejects.toThrow();
    });

    // ── Logout ────────────────────────────────────────────────────────────

    it('deve limpar user após logout', async () => {
        const { result } = renderAuth();

        // Login primeiro
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        expect(result.current.isLoggedIn).toBe(true);

        // Logout
        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
    });

    // ── Estado compartilhado (regressão Bug 1) ────────────────────────────

    it('deve compartilhar estado entre consumidores sob o mesmo provider', async () => {
        // Dois consumidores independentes do mesmo AuthProvider — simula
        // Login + Header. Após login num, o outro reflete sem remount.
        const { result } = renderHook(() => ({ a: useAuth(), b: useAuth() }), { wrapper });

        expect(result.current.b.isLoggedIn).toBe(false);

        await act(async () => {
            await result.current.a.login({ email: 'test@example.com', password: 'password123' });
        });

        expect(result.current.b.isLoggedIn).toBe(true);
        expect(result.current.b.user?.id).toBe(mockAuthResponse.userId);
    });

    it('deve lançar erro quando usado fora de um AuthProvider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);

        spy.mockRestore();
    });

    // ── Role mapping ──────────────────────────────────────────────────────

    it('deve mapear ADMIN para admin', async () => {
        server.use(
            http.post('*/api/auth/sign-in', () => {
                return HttpResponse.json({
                    data: { ...mockAuthResponse, role: 'ADMIN' },
                    success: true,
                });
            }),
        );

        const { result } = renderAuth();

        await act(async () => {
            await result.current.login({
                email: 'admin@example.com',
                password: 'password',
            });
        });

        expect(result.current.user?.role).toBe('admin');
    });

    it('deve mapear MODERATOR para poster', async () => {
        server.use(
            http.post('*/api/auth/sign-in', () => {
                return HttpResponse.json({
                    data: { ...mockAuthResponse, role: 'MODERATOR' },
                    success: true,
                });
            }),
        );

        const { result } = renderAuth();

        await act(async () => {
            await result.current.login({
                email: 'mod@example.com',
                password: 'password',
            });
        });

        expect(result.current.user?.role).toBe('poster');
    });

    it('deve mapear MEMBER para user', async () => {
        const { result } = renderAuth();

        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
            });
        });

        expect(result.current.user?.role).toBe('user');
    });
});
