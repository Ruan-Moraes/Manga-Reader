import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SearchField } from '../SearchField';

describe('SearchField', () => {
    it.each([
        ['default', undefined, 'h-11'],
        ['sm', 'sm', 'h-8'],
        ['lg', 'lg', 'h-12'],
    ] as const)('aplica a altura %s', (_, size, expectedHeight) => {
        const { container } = render(<SearchField value="" onChange={() => {}} size={size} />);

        expect(container.firstElementChild).toHaveClass(expectedHeight);
    });
});
