import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bold, Italic, Link2, Quote, Eye, EyeOff } from 'lucide-react';
import { Textarea } from '@ui/Textarea';
import { Label } from '@ui/Label';

type ToolbarButton = {
    icon: React.ElementType;
    label: string;
    open: string;
    close: string;
};

type Props = {
    content: string;
    onChange: (v: string) => void;
    preview: boolean;
    onTogglePreview: () => void;
    error?: string;
};

const ComposerEditor = ({ content, onChange, preview, onTogglePreview, error }: Props) => {
    const { t } = useTranslation('forum');
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const TOOLBAR_BUTTONS: ToolbarButton[] = [
        {
            icon: Bold,
            label: t('composer.toolbar.bold'),
            open: '**',
            close: '**',
        },
        {
            icon: Italic,
            label: t('composer.toolbar.italic'),
            open: '*',
            close: '*',
        },
        {
            icon: Link2,
            label: t('composer.toolbar.link'),
            open: '[',
            close: '](url)',
        },
        {
            icon: Quote,
            label: t('composer.toolbar.quote'),
            open: '> ',
            close: '',
        },
    ];

    const insertWrap = (open: string, close: string) => {
        const el = contentRef.current;
        if (!el) return;
        const { selectionStart: s, selectionEnd: e, value } = el;
        const selected = value.slice(s, e);
        const next = value.slice(0, s) + open + selected + close + value.slice(e);
        onChange(next);
        setTimeout(() => {
            el.selectionStart = s + open.length;
            el.selectionEnd = e + open.length;
            el.focus();
        }, 0);
    };

    return (
        <div className="mb-5">
            <div className="mb-1 flex items-center justify-between">
                <Label htmlFor="forum-content">{t('composer.contentLabel')}</Label>
                <button
                    type="button"
                    onClick={onTogglePreview}
                    className="inline-flex items-center gap-1 text-mr-tiny text-mr-fg-muted hover:text-mr-accent transition-colors"
                >
                    {preview ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    {preview ? t('composer.editMode') : t('composer.previewMode')}
                </button>
            </div>

            {!preview && (
                <div
                    role="toolbar"
                    aria-label={t('composer.formattingAria')}
                    className="mb-1 flex gap-1 rounded-mr-sm border border-mr-border border-b-0 bg-mr-surface px-2 py-1"
                >
                    {TOOLBAR_BUTTONS.map(({ icon: Icon, label, open, close }) => (
                        <button
                            key={open}
                            type="button"
                            title={label}
                            aria-label={label}
                            onClick={() => insertWrap(open, close)}
                            className="rounded p-1 text-mr-fg-muted hover:bg-mr-border hover:text-mr-fg transition-colors"
                        >
                            <Icon className="size-4" />
                        </button>
                    ))}
                    <div className="mx-1 w-px bg-mr-border" />
                    <button
                        type="button"
                        title={t('composer.spoilerTagAria')}
                        aria-label={t('composer.spoilerTagAria')}
                        onClick={() => insertWrap('[spoiler]', '[/spoiler]')}
                        className="rounded px-2 py-1 text-mr-tiny font-mr-bold text-mr-fg-muted hover:bg-mr-border hover:text-mr-fg transition-colors"
                    >
                        spoiler
                    </button>
                </div>
            )}

            {preview ? (
                <div className="min-h-[200px] rounded-mr-xs border border-mr-border bg-mr-surface p-4 text-mr-small text-mr-fg-muted whitespace-pre-wrap">
                    {content || <span className="italic text-mr-fg-subtle">{t('composer.previewEmpty')}</span>}
                </div>
            ) : (
                <Textarea
                    id="forum-content"
                    ref={contentRef}
                    placeholder={t('composer.contentPlaceholder')}
                    rows={8}
                    value={content}
                    onChange={e => onChange(e.target.value)}
                    error={error}
                />
            )}
            <p className="mt-1 text-mr-tiny text-mr-fg-subtle">{t('composer.spoilerNote')}</p>
        </div>
    );
};

export default ComposerEditor;
