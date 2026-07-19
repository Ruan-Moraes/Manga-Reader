import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';

/** Renderiza parágrafos (`\n\n`), **negrito** e quebras de linha simples. */
const RichText = ({ text }: { text: string }) => {
    const paras = text.split(/\n{2,}/);
    return (
        <>
            {paras.map((p, i) => (
                <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.7 }}>
                    {p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
                        /^\*\*[^*]+\*\*$/.test(seg) ? (
                            <strong key={j} style={{ color: 'var(--mr-fg)', fontWeight: 800 }}>
                                {seg.slice(2, -2)}
                            </strong>
                        ) : (
                            <Fragment key={j}>
                                {seg.split('\n').reduce<React.ReactNode[]>((acc, line, k) => (k > 0 ? acc.concat(<br key={`b${k}`} />, line) : acc.concat(line)), [])}
                            </Fragment>
                        ),
                    )}
                </p>
            ))}
        </>
    );
};

const SpoilerBlock = ({ text }: { text: string }) => {
    const { t } = useTranslation('forum');
    const [revealed, setRevealed] = useState(false);
    return (
        <div className={`forum-spoiler ${revealed ? 'revealed' : ''}`}>
            <button type="button" className="forum-spoiler-head" onClick={() => setRevealed(v => !v)}>
                <span className="forum-spoiler-badge">{t('ui.spoiler')}</span>
                <span className="forum-spoiler-instruction">{revealed ? t('ui.spoilerHide') : t('ui.spoilerReveal')}</span>
                <Eye size={14} strokeWidth={2} />
            </button>
            <div className="forum-spoiler-body">
                <RichText text={text} />
            </div>
        </div>
    );
};

type Part = { type: 'text' | 'spoiler'; value: string };

export const RichBody = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts: Part[] = [];
    const re = /\[spoiler\](.+?)\[\/spoiler\]/gs;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
        parts.push({ type: 'spoiler', value: m[1] });
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

    return (
        <div className="forum-rich">
            {parts.map((p, i) => (p.type === 'spoiler' ? <SpoilerBlock key={i} text={p.value} /> : <RichText key={i} text={p.value} />))}
        </div>
    );
};
