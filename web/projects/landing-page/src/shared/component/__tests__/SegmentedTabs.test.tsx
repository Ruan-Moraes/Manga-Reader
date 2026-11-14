import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import SegmentedTabs from '../SegmentedTabs';

function TabsFixture() {
    const [value, setValue] = useState<'one' | 'two'>('one');

    return (
        <SegmentedTabs
            ariaLabel="Exemplo"
            tabs={[
                { id: 'one', label: 'Primeira' },
                { id: 'two', label: 'Segunda' },
            ]}
            value={value}
            onValueChange={setValue}
            panelId="example"
        />
    );
}

describe('SegmentedTabs', () => {
    it('uses roving tabIndex', () => {
        render(<TabsFixture />);

        expect(screen.getByRole('tab', { name: 'Primeira' })).toHaveAttribute(
            'tabindex',
            '0',
        );
        expect(screen.getByRole('tab', { name: 'Segunda' })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('selects and focuses the next tab with ArrowRight', async () => {
        const user = userEvent.setup();
        render(<TabsFixture />);
        screen.getByRole('tab', { name: 'Primeira' }).focus();

        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('tab', { name: 'Segunda' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('tab', { name: 'Segunda' })).toHaveFocus();
    });

    it('keeps the selected tab legible while hovered', () => {
        render(<TabsFixture />);

        expect(screen.getByRole('tab', { name: 'Primeira' })).toHaveClass(
            'bg-accent',
            'text-on-accent',
            'hover:text-on-accent',
        );
    });
});
