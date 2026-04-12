import { useState, type ReactNode } from "react";

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
    <div className="border-b border-[#252526]">
      <button
        className="flex w-full items-center justify-between py-4 text-left font-medium text-white hover:text-[#ddda2a] transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span
          className={`ml-4 flex-shrink-0 text-[#ddda2a] text-lg transition-transform duration-200 ${open ? "rotate-45" : "rotate-0"}`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 pb-4" : "max-h-0"}`}
      >
        <p className="text-[#727273] text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function Accordion({ items }: AccordionProps) {
  return (
    <div className="divide-y divide-[#252526]">
      {items.map((item) => (
        <AccordionEntry key={item.question} {...item} />
      ))}
    </div>
  );
}
