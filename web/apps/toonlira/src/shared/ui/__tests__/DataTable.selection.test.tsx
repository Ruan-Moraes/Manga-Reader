import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import DataTable, { type Column } from '../DataTable';

type Row = { id: string; name: string };

const columns: Column<Row>[] = [{ key: 'name', header: 'Nome', render: row => <span>{row.name}</span> }];
const data: Row[] = [
    { id: 'a', name: 'Alfa' },
    { id: 'b', name: 'Beta' },
];

const baseProps = {
    columns,
    data,
    keyExtractor: (row: Row) => row.id,
    page: 0,
    totalPages: 1,
    onPageChange: vi.fn(),
};

describe('DataTable — seleção múltipla (opt-in)', () => {
    it('sem props de seleção não renderiza checkboxes (aditividade)', () => {
        render(<DataTable {...baseProps} />);
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        expect(screen.getByText('Alfa')).toBeInTheDocument();
    });

    it('com selectable renderiza checkbox por linha + select-all no header', () => {
        render(<DataTable {...baseProps} selectable selectedKeys={new Set()} selectAllLabel="Selecionar tudo" selectRowLabel={row => `Selecionar ${row.name}`} />);
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(screen.getByLabelText('Selecionar tudo')).toBeInTheDocument();
    });

    it('dispara onToggleRow com a key da linha', () => {
        const onToggleRow = vi.fn();
        render(<DataTable {...baseProps} selectable selectedKeys={new Set()} onToggleRow={onToggleRow} selectRowLabel={row => `Selecionar ${row.name}`} />);

        fireEvent.click(screen.getByLabelText('Selecionar Beta'));

        expect(onToggleRow).toHaveBeenCalledWith('b');
    });

    it('select-all recebe as keys da página e marca todos quando todos selecionados', () => {
        const onToggleAll = vi.fn();
        render(<DataTable {...baseProps} selectable selectedKeys={new Set(['a', 'b'])} onToggleAll={onToggleAll} selectAllLabel="Selecionar tudo" />);

        const selectAll = screen.getByLabelText('Selecionar tudo');
        expect(selectAll).toBeChecked();

        fireEvent.click(selectAll);
        expect(onToggleAll).toHaveBeenCalledWith(['a', 'b']);
    });

    it('linha selecionada não dispara onRowClick ao clicar no checkbox', () => {
        const onRowClick = vi.fn();
        render(
            <DataTable {...baseProps} selectable selectedKeys={new Set()} onToggleRow={vi.fn()} onRowClick={onRowClick} selectRowLabel={row => `Selecionar ${row.name}`} />,
        );

        fireEvent.click(screen.getByLabelText('Selecionar Alfa'));

        expect(onRowClick).not.toHaveBeenCalled();
    });
});
