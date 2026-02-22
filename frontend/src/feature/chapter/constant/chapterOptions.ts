import { type SelectOption } from '@shared/component/ui/StyledSelect';

const TOTAL_CHAPTERS = 10;

// TODO: Substituir por dados reais vindos do backend
export const CHAPTER_OPTIONS: SelectOption[] = Array.from(
    { length: TOTAL_CHAPTERS },
    (_, i) => ({
        value: String(i + 1),
        label: `Capítulo ${i + 1}`,
    }),
);
