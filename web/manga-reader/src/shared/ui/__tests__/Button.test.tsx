import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Search } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
    it('renderiza com variant primary', () => {
        render(<Button variant="primary">Salvar</Button>);
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('renderiza com variant raised (padrão)', () => {
        render(<Button>Cancelar</Button>);
        const btn = screen.getByRole('button', { name: 'Cancelar' });
        expect(btn).toBeInTheDocument();
    });

    it('renderiza com variant ghost', () => {
        render(<Button variant="ghost">Voltar</Button>);
        expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    });

    it('dispara onClick ao clicar', async () => {
        const handler = vi.fn();
        render(<Button onClick={handler}>Clique</Button>);
        await userEvent.click(screen.getByRole('button'));
        expect(handler).toHaveBeenCalledOnce();
    });

    it('disabled bloqueia click e tab order', async () => {
        const handler = vi.fn();
        render(
            <Button disabled onClick={handler}>
                Desabilitado
            </Button>,
        );
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        await userEvent.click(btn);
        expect(handler).not.toHaveBeenCalled();
    });

    it('loading mostra spinner e bloqueia click', async () => {
        const handler = vi.fn();
        render(
            <Button loading onClick={handler}>
                Enviando
            </Button>,
        );
        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('aria-busy', 'true');
        expect(btn).toBeDisabled();
        await userEvent.click(btn);
        expect(handler).not.toHaveBeenCalled();
    });

    it('renderiza icon à esquerda quando não loading', () => {
        render(<Button icon={Search}>Buscar</Button>);
        expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });

    it('danger aplica texto de perigo em variant ghost', () => {
        render(
            <Button variant="ghost" danger>
                Excluir
            </Button>,
        );
        const btn = screen.getByRole('button');
        expect(btn.className).toMatch(/mr-danger/);
    });

    it('block ocupa largura total', () => {
        render(<Button block>Confirmar</Button>);
        expect(screen.getByRole('button').className).toMatch(/w-full/);
    });

    it('size sm aplica classe correta', () => {
        render(<Button size="sm">Mini</Button>);
        expect(screen.getByRole('button').className).toMatch(/py-1/);
    });

    it('aceita className extra sem sobrescrever base', () => {
        render(<Button className="mt-4">Extra</Button>);
        expect(screen.getByRole('button').className).toMatch(/mt-4/);
    });
});
