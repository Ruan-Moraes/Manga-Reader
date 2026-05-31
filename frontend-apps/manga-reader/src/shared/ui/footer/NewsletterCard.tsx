import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

import type { FooterTexts } from './footer.types';

export const NewsletterCard = ({ onSubscribe, texts }: { onSubscribe?: (email: string) => void | Promise<void>; texts: Required<FooterTexts> }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) return;

        await onSubscribe?.(email);

        setEmail('');
        setSent(true);
    };

    return (
        <div className="w-full rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-4" style={{ background: 'var(--mr-secondary)' }}>
            <span className="text-xs font-mr-extrabold uppercase tracking-[0.1rem] block mb-2">{texts.newsletterLabel}</span>
            {sent ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-mr-xs border px-3 py-2 text-[12px] font-mr-semibold"
                    style={{
                        background: 'var(--mr-accent-25)',
                        borderColor: 'var(--mr-accent-50)',
                        color: 'var(--mr-accent)',
                    }}
                >
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    <span>{texts.newsletterSuccess}</span>
                </div>
            ) : (
                <form className="flex items-stretch gap-2" onSubmit={handleSubmit} noValidate>
                    <input
                        type="email"
                        required
                        aria-label="Email"
                        placeholder={texts.newsletterPlaceholder}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="h-11 min-w-0 flex-1 rounded-[2px] border border-mr-tertiary bg-transparent px-3 text-[13px] text-mr-fg outline-none transition-colors duration-200 placeholder:text-mr-fg-subtle focus:border-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
                    />
                    <button
                        type="submit"
                        aria-label={texts.newsletterSubmitAria}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-mr-accent text-mr-primary transition-opacity duration-200 hover:opacity-[0.85] focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
                    >
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </form>
            )}
            {!sent && <p className="mt-2 text-[11px] text-mr-fg-subtle">{texts.newsletterHint}</p>}
        </div>
    );
};
