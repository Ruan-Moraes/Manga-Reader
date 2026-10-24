import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { PostShell } from '../PostShell';

describe('PostShell', () => {
    it('renderiza avatar (iniciais) e conteúdo', () => {
        render(
            <PostShell avatar={{ name: 'Ana Beatriz' }}>
                <p>corpo</p>
            </PostShell>,
        );
        expect(screen.getByText('AB')).toBeInTheDocument();
        expect(screen.getByText('corpo')).toBeInTheDocument();
    });

    it('avatar clicável dispara onClickAvatar', async () => {
        const onClick = vi.fn();
        render(
            <PostShell avatar={{ name: 'Ana' }} onClickAvatar={onClick}>
                <p>x</p>
            </PostShell>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Ana' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('top-level tem moldura de card; flat não', () => {
        const { container, rerender } = render(
            <PostShell avatar={{ name: 'Ana' }}>
                <p>x</p>
            </PostShell>,
        );
        expect(container.firstChild).toHaveClass('border');
        rerender(
            <PostShell avatar={{ name: 'Ana' }} flat>
                <p>x</p>
            </PostShell>,
        );
        expect(container.firstChild).not.toHaveClass('border');
    });

    it('renderiza faixa replyingTo', () => {
        render(
            <PostShell avatar={{ name: 'Ana' }} replyingTo={<span>respondendo a @x</span>}>
                <p>y</p>
            </PostShell>,
        );
        expect(screen.getByText('respondendo a @x')).toBeInTheDocument();
    });
});
