import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import LocalizedTextInput from '../LocalizedTextInput';
import type { LocalizedString } from '@shared/type/i18n';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback ?? key,
    }),
}));

const Harness = ({
    initial = {},
    onChange,
    multiline = false,
}: {
    initial?: LocalizedString;
    onChange?: (next: LocalizedString) => void;
    multiline?: boolean;
}) => {
    const [value, setValue] = useState<LocalizedString>(initial);
    return (
        <LocalizedTextInput
            label="Label"
            value={value}
            onChange={(next) => {
                setValue(next);
                onChange?.(next);
            }}
            multiline={multiline}
        />
    );
};

describe('LocalizedTextInput', () => {
    it('renders one tab per supported language', () => {
        render(<Harness />);
        expect(screen.getByRole('tab', { name: /pt-BR/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /en-US/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /es-ES/ })).toBeInTheDocument();
    });

    it('starts on pt-BR tab and shows missing indicator when required + empty', () => {
        render(<Harness />);
        const ptTab = screen.getByRole('tab', { name: /pt-BR/ });
        expect(ptTab).toHaveAttribute('aria-selected', 'true');
        expect(ptTab.textContent).toContain('●'); // missing dot
    });

    it('switches tab when clicked and preserves other-tab content', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        const ptInput = screen.getByRole('textbox');
        fireEvent.change(ptInput, { target: { value: 'Olá' } });
        expect(onChange).toHaveBeenLastCalledWith({ 'pt-BR': 'Olá' });

        fireEvent.click(screen.getByRole('tab', { name: /en-US/ }));
        const enInput = screen.getByRole('textbox');
        expect(enInput).toHaveValue('');

        fireEvent.change(enInput, { target: { value: 'Hello' } });
        expect(onChange).toHaveBeenLastCalledWith({
            'pt-BR': 'Olá',
            'en-US': 'Hello',
        });
    });

    it('shows filled indicator when language has non-empty value', () => {
        render(<Harness initial={{ 'pt-BR': 'Olá' }} />);
        const ptTab = screen.getByRole('tab', { name: /pt-BR/ });
        expect(ptTab.textContent).toContain('●');
    });

    it('renders textarea when multiline=true', () => {
        const { container } = render(<Harness multiline />);
        expect(container.querySelector('textarea')).toBeInTheDocument();
        expect(container.querySelector('input[type="text"]')).toBeNull();
    });
});
