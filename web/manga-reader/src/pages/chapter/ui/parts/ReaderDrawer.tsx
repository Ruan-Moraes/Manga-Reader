import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bookmark, Library, Newspaper, X, type LucideIcon } from 'lucide-react';

import type { Bg, Direction, Fit, ReadMode } from '../../model/useChapterReader';

interface ReaderDrawerProps {
    mode: ReadMode;
    direction: Direction;
    fit: Fit;
    gap: number;
    bg: Bg;
    inlineCmts: boolean;
    onMode: (v: ReadMode) => void;
    onDirection: (v: Direction) => void;
    onFit: (v: Fit) => void;
    onGap: (v: number) => void;
    onBg: (v: Bg) => void;
    onInlineCmts: (v: boolean) => void;
    onClose: () => void;
}

const OptGroup = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="reader-opt-group">
        <div className="reader-opt-label">{label}</div>
        {children}
    </div>
);

const Pill = ({ icon: Icon, label, active, onClick }: { icon?: LucideIcon; label: string; active: boolean; onClick: () => void }) => (
    <button type="button" className={`reader-opt-pill ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
        {Icon && <Icon size={16} strokeWidth={2} className="reader-opt-pill-icon" />}
        <span>{label}</span>
    </button>
);

export const ReaderDrawer = ({ mode, direction, fit, gap, bg, inlineCmts, onMode, onDirection, onFit, onGap, onBg, onInlineCmts, onClose }: ReaderDrawerProps) => {
    const { t } = useTranslation('manga');

    return (
        <>
            <div className="reader-overlay" onClick={onClose} aria-hidden="true" />
            <aside className="reader-drawer" role="dialog" aria-label={t('reader.configTitle')}>
                <header className="reader-drawer-head">
                    <h2 className="reader-drawer-title">{t('reader.configTitle')}</h2>
                    <button type="button" className="reader-icon-btn" onClick={onClose} aria-label={t('reader.closeAria')}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className="reader-drawer-body">
                    <OptGroup label={t('reader.modeSection')}>
                        <div className="reader-opt-grid cols-3">
                            <Pill icon={Library} label={t('reader.modeVertical')} active={mode === 'vertical'} onClick={() => onMode('vertical')} />
                            <Pill icon={Newspaper} label={t('reader.modePaged')} active={mode === 'paged'} onClick={() => onMode('paged')} />
                            <Pill icon={Bookmark} label={t('reader.modeDouble')} active={mode === 'double'} onClick={() => onMode('double')} />
                        </div>
                    </OptGroup>

                    {mode !== 'vertical' && (
                        <OptGroup label={t('reader.directionSection')}>
                            <div className="reader-opt-grid">
                                <Pill icon={ArrowRight} label={t('reader.dirLtr')} active={direction === 'ltr'} onClick={() => onDirection('ltr')} />
                                <Pill icon={ArrowRight} label={t('reader.dirRtl')} active={direction === 'rtl'} onClick={() => onDirection('rtl')} />
                            </div>
                        </OptGroup>
                    )}

                    <OptGroup label={t('reader.fitSection')}>
                        <div className="reader-opt-grid cols-3">
                            <Pill label={t('reader.fitWidth')} active={fit === 'width'} onClick={() => onFit('width')} />
                            <Pill label={t('reader.fitHeight')} active={fit === 'height'} onClick={() => onFit('height')} />
                            <Pill label={t('reader.fitOriginal')} active={fit === 'original'} onClick={() => onFit('original')} />
                        </div>
                    </OptGroup>

                    {mode === 'vertical' && (
                        <OptGroup label={t('reader.gapSection')}>
                            <div className="reader-opt-grid cols-4">
                                {[0, 8, 16, 32].map(g => (
                                    <Pill key={g} label={String(g)} active={gap === g} onClick={() => onGap(g)} />
                                ))}
                            </div>
                        </OptGroup>
                    )}

                    <OptGroup label={t('reader.bgSection')}>
                        <div className="reader-opt-grid cols-3">
                            <Pill label={t('reader.bgBlack')} active={bg === 'black'} onClick={() => onBg('black')} />
                            <Pill label={t('reader.bgDark')} active={bg === 'dark'} onClick={() => onBg('dark')} />
                            <Pill label={t('reader.bgPaper')} active={bg === 'paper'} onClick={() => onBg('paper')} />
                        </div>
                    </OptGroup>

                    <OptGroup label={t('reader.behaviorSection')}>
                        <button type="button" className="reader-opt-toggle" data-on={inlineCmts ? 'true' : 'false'} onClick={() => onInlineCmts(!inlineCmts)} aria-pressed={inlineCmts}>
                            <span className="reader-opt-toggle-body">
                                <span className="reader-opt-toggle-title">{t('reader.inlineCommentsTitle')}</span>
                                <span className="reader-opt-toggle-sub">{t('reader.inlineCommentsSub')}</span>
                            </span>
                            <span className="reader-switch" />
                        </button>
                    </OptGroup>

                    <OptGroup label={t('reader.shortcutsSection')}>
                        <div className="reader-kbd-list">
                            <div className="reader-kbd-row">
                                <span>{t('reader.shortcuts.nextPage')}</span>
                                <span>
                                    <kbd className="reader-kbd">→</kbd> <kbd className="reader-kbd">J</kbd>
                                </span>
                            </div>
                            <div className="reader-kbd-row">
                                <span>{t('reader.shortcuts.prevPage')}</span>
                                <span>
                                    <kbd className="reader-kbd">←</kbd> <kbd className="reader-kbd">K</kbd>
                                </span>
                            </div>
                            <div className="reader-kbd-row">
                                <span>{t('reader.shortcuts.settings')}</span>
                                <kbd className="reader-kbd">S</kbd>
                            </div>
                            <div className="reader-kbd-row">
                                <span>{t('reader.shortcuts.close')}</span>
                                <kbd className="reader-kbd">Esc</kbd>
                            </div>
                        </div>
                    </OptGroup>
                </div>
            </aside>
        </>
    );
};
