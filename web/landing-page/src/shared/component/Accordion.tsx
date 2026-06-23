import { useState } from 'react';

interface AccordionItem {
    question: string;
    answer: string;
}

interface AccordionProps {
    items: AccordionItem[];
}

function AccordionEntry({ question, answer }: AccordionItem) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-secondary">
            <button
                className="flex w-full items-center justify-between py-4 text-left font-medium text-white hover:text-accent transition-colors"
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
            >
                <span>{question}</span>
                <span
                    className={`ml-4 flex-shrink-0 text-accent text-lg transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`}
                >
                    +
                </span>
            </button>
            <div
                className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <p className="text-tertiary text-sm leading-relaxed">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Accordion({ items }: AccordionProps) {
    return (
        <div className="divide-y divide-secondary">
            {items.map(item => (
                <AccordionEntry key={item.question} {...item} />
            ))}
        </div>
    );
}
