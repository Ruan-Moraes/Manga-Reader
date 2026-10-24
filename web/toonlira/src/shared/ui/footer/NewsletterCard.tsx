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
        <div className="w-full rounded-ui-xs border border-ui-gray-800 bg-ui-secondary p-4" style={{ background: 'var(--ui-secondary)' }}>
            <span className="text-xs font-ui-extrabold uppercase tracking-[0.1rem] block mb-2">{texts.newsletterLabel}</span>
            {sent ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-ui-xs border px-3 py-2 text-[12px] font-ui-semibold"
                    style={{
                        background: 'var(--ui-accent-25)',
                        borderColor: 'var(--ui-accent-50)',
                        color: 'var(--ui-accent)',
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
                        className="py-2.5 min-w-0 flex-1 rounded-[2px] border border-ui-tertiary bg-transparent px-3 text-[13px] text-ui-fg outline-none transition-colors duration-200 placeholder:text-ui-fg-subtle focus:border-ui-accent-border ui-focus-ring"
                    />
                    <button
                        type="submit"
                        aria-label={texts.newsletterSubmitAria}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-ui-accent text-ui-on-accent transition-opacity duration-200 hover:opacity-[0.85] ui-focus-ring"
                    >
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </form>
            )}
            {!sent && <p className="mt-2 text-[11px] text-ui-fg-subtle">{texts.newsletterHint}</p>}
        </div>
    );
};
