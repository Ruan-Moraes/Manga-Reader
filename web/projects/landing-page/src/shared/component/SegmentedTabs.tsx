import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentedTab<T extends string> {
    id: T;
    label: string;
    icon?: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
    ariaLabel: string;
    tabs: SegmentedTab<T>[];
    value: T;
    onValueChange: (value: T) => void;
    panelId: string;
}

export default function SegmentedTabs<T extends string>({
    ariaLabel,
    tabs,
    value,
    onValueChange,
    panelId,
}: SegmentedTabsProps<T>) {
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    function select(index: number) {
        const tab = tabs[index];
        if (!tab) return;
        onValueChange(tab.id);
        refs.current[index]?.focus();
    }

    function handleKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) {
        let nextIndex: number | undefined;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = (index + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = tabs.length - 1;
        }

        if (nextIndex === undefined) return;
        event.preventDefault();
        select(nextIndex);
    }

    return (
        <div
            className="inline-flex max-w-full flex-wrap justify-center overflow-hidden rounded-xl border border-border bg-surface-muted p-1.5 max-[559px]:w-full"
            role="tablist"
            aria-label={ariaLabel}
        >
            {tabs.map((tab, index) => {
                const selected = tab.id === value;
                return (
                    <button
                        key={tab.id}
                        ref={element => {
                            refs.current[index] = element;
                        }}
                        id={`${panelId}-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`${panelId}-panel`}
                        tabIndex={selected ? 0 : -1}
                        className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[9px] border border-transparent px-3.5 py-2 text-[0.8125rem] font-extrabold tracking-[0.02em] text-copy transition-[background-color,color,box-shadow,scale] duration-[180ms] hover:text-fg active:scale-[0.98] max-[559px]:flex-[1_1_44%] max-[559px]:justify-center max-[559px]:px-2.5 ${selected ? 'bg-accent text-on-accent hover:text-on-accent' : ''}`}
                        onClick={() => onValueChange(tab.id)}
                        onKeyDown={event => handleKeyDown(event, index)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
