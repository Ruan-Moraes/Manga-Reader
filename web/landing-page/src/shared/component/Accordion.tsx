import { useState } from 'react';

interface AccordionItem {
    question: string;
    answer: string;
}

export default function Accordion({
    items,
    defaultOpen = -1,
}: {
    items: AccordionItem[];
    defaultOpen?: number;
}) {
    const [openIndex, setOpenIndex] = useState(defaultOpen);

    return (
        <div className="mx-auto max-w-[840px] border-t border-border">
            {items.map((item, index) => {
                const open = openIndex === index;
                const headerId = `faq-heading-${index}`;
                const panelId = `faq-panel-${index}`;
                return (
                    <div className="border-b border-border" key={item.question}>
                        <h3>
                            <button
                                className={`flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-1 py-3 text-left text-[clamp(1rem,2vw,1.075rem)] font-extrabold text-fg transition-colors duration-[180ms] hover:text-accent-fg ${open ? 'text-accent-fg' : ''}`}
                                id={headerId}
                                type="button"
                                aria-expanded={open}
                                aria-controls={panelId}
                                onClick={() => setOpenIndex(open ? -1 : index)}
                            >
                                <span>{item.question}</span>
                                <span
                                    className={`shrink-0 text-2xl leading-none text-accent-fg transition-[rotate] duration-[180ms] ${open ? 'rotate-45' : ''}`}
                                    aria-hidden="true"
                                >
                                    +
                                </span>
                            </button>
                        </h3>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={headerId}
                            aria-hidden={!open}
                            className={`grid transition-[grid-template-rows,opacity] duration-[240ms] ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                            <div className="overflow-hidden">
                                <p className="m-0 max-w-[760px] px-1 pb-[22px] text-[0.9375rem] leading-[1.7] text-copy-muted">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
