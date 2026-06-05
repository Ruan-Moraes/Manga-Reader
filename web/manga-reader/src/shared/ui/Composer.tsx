import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bold, Code, Eye, HelpCircle, Italic, Link2, List, MessageSquare, Quote, Upload, X } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { getStoredSession } from '@shared/service/session';

import { Avatar } from '@ui/Avatar';
import { Markdown } from '@ui/Markdown';

const MAX_LENGTH = 2000;

export interface ComposerHandle {
    focus: () => void;
    /** Pré-preenche uma menção `@handle` e foca (usado por "Responder" do fórum). */
    insertMention: (handle: string) => void;
}

export interface ComposerProps {
    /** Variante de resposta: avatar menor. */
    compact?: boolean;
    placeholder?: string;
    submitLabel?: string;
    /** Rótulo acessível do textarea (ex.: "Sua resposta"). */
    ariaLabel?: string;
    onCancel?: () => void;
    /** Sem moldura externa (sem borda/fundo/avatar) — p/ usar dentro de modal. */
    bare?: boolean;
    /** Persiste o conteúdo. Se resolver sem erro, o composer limpa o texto. */
    onSubmit: (textContent: string | null, imageContent: string | null) => void | Promise<void>;
    /** Anexos (opcional) — injetados pelo dono; sem eles, não há upload nem thumbnails. */
    images?: string[];
    onAddImage?: () => void;
    onRemoveImage?: (index: number) => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(
    ({ compact = false, placeholder, submitLabel, ariaLabel, onCancel, bare = false, onSubmit, images, onAddImage, onRemoveImage }, ref) => {
        const { t } = useTranslation('common');

        const [tab, setTab] = useState<'write' | 'preview'>('write');
        const [value, setValue] = useState('');
        const [focused, setFocused] = useState(false);

        const textareaRef = useRef<HTMLTextAreaElement>(null);

        const session = getStoredSession();

        useImperativeHandle(ref, () => ({
            focus: () => {
                setTab('write');

                const el = textareaRef.current;

                el?.focus();
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },
            insertMention: (handle: string) => {
                const mention = `@${handle} `;

                setTab('write');
                setValue(prev => (prev.includes(mention.trim()) ? prev : `${mention}${prev}`));

                requestAnimationFrame(() => {
                    const el = textareaRef.current;
                    el?.focus();
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            },
        }));

        // Envolve a seleção com marcadores markdown (igual ao protótipo).
        const wrap = (before: string, after = before, block = false) => {
            const el = textareaRef.current;

            if (!el) return;

            const start = el.selectionStart;
            const end = el.selectionEnd;
            const selected = value.slice(start, end) || (block ? '' : 'texto');
            const insert = block ? before + (selected || 'citação') : before + selected + after;
            const next = value.slice(0, start) + insert + value.slice(end);

            setValue(next);

            requestAnimationFrame(() => {
                el.focus();

                const pos = start + before.length;

                el.setSelectionRange(pos, pos + selected.length);
            });
        };

        const tools = [
            { key: 'bold', icon: Bold, title: t('composer.tools.bold'), run: () => wrap('**') },
            { key: 'italic', icon: Italic, title: t('composer.tools.italic'), run: () => wrap('*') },
            { key: 'code', icon: Code, title: t('composer.tools.code'), run: () => wrap('`') },
            { key: 'sep1', sep: true },
            { key: 'quote', icon: Quote, title: t('composer.tools.quote'), run: () => wrap('> ', '', true) },
            { key: 'list', icon: List, title: t('composer.tools.list'), run: () => wrap('- ', '', true) },
            { key: 'link', icon: Link2, title: t('composer.tools.link'), run: () => wrap('[', '](https://)') },
            { key: 'spoiler', icon: Eye, title: t('composer.tools.spoiler'), run: () => wrap('||') },
        ] as const;

        const hasImages = (images?.length ?? 0) > 0;
        const canSubmit = value.trim().length > 0 || hasImages;

        const handleSubmit = async () => {
            if (!canSubmit) return;

            try {
                await onSubmit(value.trim() || null, images?.join(',') || null);

                setValue('');
                setTab('write');
            } catch {
                // Falha de persistência: mantém o conteúdo para o usuário tentar de novo.
            }
        };

        return (
            <div
                className={cn(
                    'cs-composer',
                    bare
                        ? ''
                        : cn(
                              'grid gap-3 rounded-mr-md border bg-mr-surface p-3.5 transition-colors md:grid-cols-[auto_1fr]',
                              focused ? 'border-mr-accent-50 shadow-mr-elevated' : 'border-mr-border',
                          ),
                )}
            >
                <div className={bare ? 'hidden' : 'hidden md:block'}>
                    <Avatar src={session?.photoUrl} name={session?.name ?? 'Você'} size={compact ? 32 : 40} />
                </div>

                <div className="flex min-w-0 flex-col gap-2.5">
                    {/* abas */}
                    <div className="flex gap-0.5 border-b border-mr-border">
                        {(['write', 'preview'] as const).map(key => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={cn(
                                    '-mb-px whitespace-nowrap border-b-2 px-3 py-[7px] text-[12.5px] font-mr-bold transition-colors max-mobile-md:px-2',
                                    tab === key ? 'border-mr-accent text-mr-accent' : 'border-transparent text-mr-fg-subtle hover:text-mr-fg',
                                )}
                            >
                                {key === 'write' ? t('composer.write') : t('composer.preview')}
                            </button>
                        ))}
                    </div>

                    {tab === 'write' ? (
                        <>
                            <div className="flex flex-wrap items-center gap-0.5">
                                {tools.map(tool =>
                                    'sep' in tool ? (
                                        <span key={tool.key} className="mx-1 h-[18px] w-px bg-mr-border" />
                                    ) : (
                                        <button
                                            key={tool.key}
                                            type="button"
                                            title={tool.title}
                                            aria-label={tool.title}
                                            onMouseDown={event => event.preventDefault()}
                                            onClick={tool.run}
                                            className="grid size-[30px] place-items-center rounded-mr-xs border border-transparent text-mr-fg-subtle transition-all hover:border-mr-chip-border hover:bg-mr-chip hover:text-mr-fg"
                                        >
                                            <tool.icon className="size-[15px]" aria-hidden="true" />
                                        </button>
                                    ),
                                )}
                                {onAddImage && (
                                    <button
                                        type="button"
                                        title={t('composer.uploadImage')}
                                        aria-label={t('composer.uploadImage')}
                                        onClick={onAddImage}
                                        className="grid size-[30px] place-items-center rounded-mr-xs border border-transparent text-mr-fg-subtle transition-all hover:border-mr-chip-border hover:bg-mr-chip hover:text-mr-fg"
                                    >
                                        <Upload className="size-[15px]" aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={value}
                                placeholder={placeholder}
                                aria-label={ariaLabel}
                                maxLength={MAX_LENGTH}
                                onChange={event => setValue(event.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                className="min-h-24 w-full resize-y rounded-[6px] border border-mr-border bg-mr-surface-muted px-3 py-3 text-mr-body leading-relaxed text-mr-fg placeholder:text-mr-tertiary focus:border-mr-accent focus:outline-none"
                            />
                        </>
                    ) : (
                        <div className="min-h-24 rounded-[6px] border border-mr-border bg-mr-surface-muted px-3 py-3">
                            {value.trim() ? (
                                <Markdown text={value} className="text-mr-body leading-[1.62] text-mr-fg-muted" />
                            ) : (
                                <span className="italic text-mr-tertiary">{t('composer.previewEmpty')}</span>
                            )}
                        </div>
                    )}

                    {hasImages && (
                        <div className="flex flex-wrap gap-2">
                            {images!.map((src, index) => (
                                <div key={src} className="relative inline-block">
                                    <img src={src} alt={t('composer.imageAlt', { index: index + 1 })} className="max-h-40 rounded-mr-xs object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveImage?.(index)}
                                        aria-label={t('composer.removeImage')}
                                        className="absolute right-0 top-0 rounded-bl-xs rounded-tr-xs bg-mr-danger px-1.5 py-0.5 text-xs text-white opacity-75 hover:opacity-100"
                                    >
                                        <X className="size-3" aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* rodapé */}
                    <div className="flex flex-wrap items-center justify-between gap-3 max-md:justify-end">
                        <span className="inline-flex flex-wrap items-center gap-1.5 text-[11.5px] text-mr-tertiary max-md:hidden">
                            <HelpCircle className="size-3" aria-hidden="true" />
                            {t('composer.hint')}
                        </span>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11.5px] tabular-nums text-mr-tertiary">
                                {value.length} / {MAX_LENGTH}
                            </span>
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    aria-label={t('composer.cancel')}
                                    className="inline-flex py-2.5 items-center gap-1.5 rounded-mr-xs border border-mr-chip-border bg-mr-chip px-[13px] text-[12.5px] font-mr-bold text-mr-fg-subtle transition-all hover:border-mr-accent-50 hover:text-mr-fg max-md:justify-center max-md:gap-0 max-md:px-3"
                                >
                                    <X className="size-[15px] md:hidden" aria-hidden="true" />
                                    <span className="hidden md:inline">{t('composer.cancel')}</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                aria-label={submitLabel ?? t('composer.submit')}
                                className="inline-flex py-2.5 items-center gap-1.5 rounded-mr-xs border border-mr-accent bg-mr-accent px-[18px] text-[13px] font-mr-extrabold text-mr-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 max-md:justify-center max-md:px-3"
                            >
                                <MessageSquare className="size-[15px]" aria-hidden="true" />
                                <span className="hidden md:inline">{submitLabel ?? t('composer.submit')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

Composer.displayName = 'Composer';

export default Composer;
