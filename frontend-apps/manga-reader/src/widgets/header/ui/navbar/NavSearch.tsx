import type { FocusEvent, KeyboardEvent, RefObject } from 'react';
import { useRef } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

type Suggestion = {
    key: string;
    title: string;
    meta: string;
};

type Props = {
    value: string;
    onChange: (v: string) => void;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    onSubmit: () => void;
    onSelectRecent: (q: string) => void;
    onSelectSuggestion: (s: Suggestion) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    height?: number;
    showShortcut?: boolean;
};

const SUGGESTIONS: Suggestion[] = [
    { key: 'solo-leveling', title: 'Solo Leveling', meta: 'Manhwa · 179 capítulos' },
    { key: 'vagabond', title: 'Vagabond', meta: 'Mangá · 327 capítulos' },
    { key: 'omniscient-reader', title: 'Omniscient Reader', meta: 'Manhwa · 218 capítulos' },
];

const RECENTS = ['berserk', 'one piece capítulo 1120', 'grupo: Tsuki Scans'];

const NavSearch = ({
    value,
    onChange,
    focused,
    onFocus,
    onBlur,
    onSubmit,
    onSelectRecent,
    onSelectSuggestion,
    inputRef,
    height = 42,
    showShortcut = true,
}: Props) => {
    const { t } = useTranslation('layout');
    const containerRef = useRef<HTMLDivElement>(null);

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
        }
    };

    const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) onBlur();
    };

    return (
        <div ref={containerRef} onBlur={handleBlur} className="relative w-full">
            <label
                className={cn(
                    'flex w-full items-center gap-[10px] border bg-mr-primary px-[14px] transition-colors duration-mr-default',
                    focused ? 'border-mr-accent' : 'border-mr-tertiary',
                )}
                style={{ height, borderRadius: 2, paddingRight: 10 }}
            >
                <Search
                    aria-hidden="true"
                    strokeWidth={2}
                    className={cn('size-[18px] shrink-0 transition-colors duration-mr-default', focused ? 'text-mr-accent' : 'text-mr-tertiary')}
                />
                <input
                    ref={inputRef}
                    type="search"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    placeholder={t('search.placeholder')}
                    aria-label={t('search.ariaLabel')}
                    className="min-w-0 flex-1 bg-transparent text-mr-body text-mr-fg outline-none placeholder:text-mr-tertiary"
                    style={{ letterSpacing: '0.0625rem' }}
                />
                {showShortcut && !value && (
                    <kbd
                        aria-label={t('search.kbdHint')}
                        className="inline-flex items-center font-mr-mono text-[11px] text-mr-gray-300"
                        style={{
                            padding: '3px 7px',
                            background: 'var(--mr-gray-800)',
                            border: '1px solid var(--mr-gray-700)',
                            borderRadius: 2,
                            letterSpacing: '0.0625rem',
                        }}
                    >
                        ⌘K
                    </kbd>
                )}
            </label>

            {focused && (
                <div
                    role="listbox"
                    aria-label={t('search.ariaLabel')}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] border border-mr-gray-700 bg-mr-secondary p-2"
                    style={{
                        borderRadius: 8,
                        boxShadow: '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25), 0 12px 40px -12px rgba(0,0,0,0.7)',
                        zIndex: 50,
                    }}
                >
                    <div className="px-2 pb-1 pt-2 text-[10px] font-mr-extrabold uppercase text-mr-accent" style={{ letterSpacing: '0.12em' }}>
                        {t('search.suggestionsTitle')}
                    </div>
                    <ul className="flex flex-col">
                        {SUGGESTIONS.map(s => (
                            <li key={s.key}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected="false"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        onSelectSuggestion(s);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-mr-xs p-[8px] text-left transition-colors duration-mr-default hover:bg-mr-accent-25"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="shrink-0"
                                        style={{
                                            width: 30,
                                            height: 40,
                                            border: '1px solid var(--mr-gray-700)',
                                            borderRadius: 3,
                                            background: 'linear-gradient(135deg,#2a2a2c,#1d1d1f)',
                                        }}
                                    />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-[13px] font-mr-bold leading-tight text-mr-fg" style={{ letterSpacing: '0.0625rem' }}>
                                            {s.title}
                                        </span>
                                        <span className="mt-[2px] text-[11px] leading-tight text-mr-gray-300">{s.meta}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-2 px-2 pb-1 pt-1 text-[10px] font-mr-extrabold uppercase text-mr-accent" style={{ letterSpacing: '0.12em' }}>
                        {t('search.recentTitle')}
                    </div>
                    <ul className="flex flex-col">
                        {RECENTS.map(q => (
                            <li key={q}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected="false"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        onSelectRecent(q);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-mr-xs p-[8px] text-left text-mr-gray-200 transition-colors duration-mr-default hover:bg-mr-accent-25"
                                >
                                    <Search className="size-4 shrink-0 text-mr-gray-300" aria-hidden="true" />
                                    <span className="text-[13px]" style={{ letterSpacing: '0.0625rem' }}>
                                        {q}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NavSearch;
