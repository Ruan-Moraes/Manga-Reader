import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

const OPTIONS = [
    { value: 'a', label: 'Opção A' },
    { value: 'b', label: 'Opção B' },
    { value: 'c', label: 'Opção C', disabled: true },
];

describe('Select', () => {
    it('renderiza opções', () => {
        render(<Select options={OPTIONS} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Opção A')).toBeInTheDocument();
    });

    it('renderiza placeholder', () => {
        render(<Select options={OPTIONS} placeholder="Selecione" />);
        // O combobox visível (botão Radix) mostra o placeholder; o <select> nativo
        // (aria-hidden) também o carrega como option — por isso checamos o botão.
        expect(screen.getByRole('combobox')).toHaveTextContent('Selecione');
    });

    it('exibe erro', () => {
        render(<Select options={OPTIONS} error="Obrigatório" />);
        expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    });

    it('exibe hint', () => {
        render(<Select options={OPTIONS} hint="Escolha uma" />);
        expect(screen.getByText('Escolha uma')).toBeInTheDocument();
    });

    it('aria-invalid quando erro', () => {
        render(<Select options={OPTIONS} error="Erro" />);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('disabled', () => {
        render(<Select options={OPTIONS} disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('opção com disabled', () => {
        render(<Select options={OPTIONS} />);
        // Opções vivem no <select> nativo (aria-hidden) — buscar com hidden: true.
        const optC = screen.getByRole('option', { name: 'Opção C', hidden: true });
        expect(optC).toBeDisabled();
    });
});

describe('Select multiple', () => {
    it('renderiza placeholder quando nada selecionado', () => {
        render(<Select multiple options={OPTIONS} value={[]} onChange={() => {}} placeholder="Selecione" />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Selecione');
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('expõe o estado aberto para tecnologias assistivas', async () => {
        const user = userEvent.setup();
        render(<Select multiple options={OPTIONS} value={[]} onChange={() => {}} placeholder="Selecione" />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('exibe as opções já selecionadas como chips', () => {
        render(<Select multiple options={OPTIONS} value={['a', 'b']} onChange={() => {}} />);
        expect(screen.getByText('Opção A')).toBeInTheDocument();
        expect(screen.getByText('Opção B')).toBeInTheDocument();
    });

    it('adiciona um valor ao selecionar uma opção no menu', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select multiple options={OPTIONS} value={[]} onChange={onChange} placeholder="Selecione" />);

        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByText('Opção A'));

        expect(onChange).toHaveBeenCalledWith(['a']);
    });

    it('remove um valor ao selecionar novamente uma opção já marcada', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select multiple options={OPTIONS} value={['a']} onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click((await screen.findAllByText('Opção A')).at(-1)!);

        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('remove um valor pelo botão de remoção do chip, sem abrir o menu', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select multiple options={OPTIONS} value={['a', 'b']} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Opção A' }));

        expect(onChange).toHaveBeenCalledWith(['b']);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('filtra as opções pelo campo de busca', async () => {
        const user = userEvent.setup();
        render(<Select multiple options={OPTIONS} value={[]} onChange={() => {}} searchPlaceholder="Buscar..." />);

        await user.click(screen.getByRole('combobox'));

        const search = await screen.findByPlaceholderText('Buscar...');

        await user.type(search, 'B');

        expect(screen.getByText('Opção B')).toBeInTheDocument();
        expect(screen.queryByText('Opção A')).not.toBeInTheDocument();
    });

    it('exibe mensagem de "nenhuma opção" quando a busca não encontra nada', async () => {
        const user = userEvent.setup();
        render(<Select multiple options={OPTIONS} value={[]} onChange={() => {}} noOptionsMessage="Nenhuma opção encontrada" />);

        await user.click(screen.getByRole('combobox'));

        const search = await screen.findByRole('textbox');

        await user.type(search, 'zzz');

        expect(screen.getByText('Nenhuma opção encontrada')).toBeInTheDocument();
    });
});
