import { useTranslation } from 'react-i18next';

import { Drawer } from '@ui/Drawer';
import { Kbd } from '@ui/Kbd';
import { SegmentedControl } from '@ui/SegmentedControl';
import type { Bg, Direction, Fit, ReadMode } from '../useChapterReader';
import { CHROME_HEIGHT, KEYBOARD_SHORTCUTS } from '../useChapterReader';

interface ConfigDrawerProps {
    open: boolean;
    onClose: () => void;
    mode: ReadMode;
    dir: Direction;
    fit: Fit;
    bg: Bg;
    onMode: (v: ReadMode) => void;
    onDir: (v: Direction) => void;
    onFit: (v: Fit) => void;
    onBg: (v: Bg) => void;
}

export const ConfigDrawer = ({ open, onClose, mode, dir, fit, bg, onMode, onDir, onFit, onBg }: ConfigDrawerProps) => {
    const { t } = useTranslation('manga');

    return (
        <Drawer open={open} onClose={onClose} side="right" title={t('reader.configTitle')} top={CHROME_HEIGHT}>
            <div className="flex flex-col gap-6">
                <div>
                    <p className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('reader.modeSection')}</p>
                    <SegmentedControl
                        items={[
                            {
                                value: 'vertical',
                                label: t('reader.modeVertical'),
                            },
                            { value: 'paged', label: t('reader.modePaged') },
                            { value: 'double', label: t('reader.modeDouble') },
                        ]}
                        value={mode}
                        onChange={v => onMode(v as ReadMode)}
                        size="sm"
                    />
                </div>

                {mode !== 'vertical' && (
                    <div>
                        <p className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('reader.directionSection')}</p>
                        <SegmentedControl
                            items={[
                                { value: 'ltr', label: 'LTR' },
                                { value: 'rtl', label: 'RTL' },
                            ]}
                            value={dir}
                            onChange={v => onDir(v as Direction)}
                            size="sm"
                        />
                    </div>
                )}

                <div>
                    <p className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('reader.fitSection')}</p>
                    <SegmentedControl
                        items={[
                            { value: 'width', label: t('reader.fitWidth') },
                            { value: 'height', label: t('reader.fitHeight') },
                            {
                                value: 'original',
                                label: t('reader.fitOriginal'),
                            },
                        ]}
                        value={fit}
                        onChange={v => onFit(v as Fit)}
                        size="sm"
                    />
                </div>

                <div>
                    <p className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('reader.bgSection')}</p>
                    <SegmentedControl
                        items={[
                            { value: 'black', label: t('reader.bgBlack') },
                            { value: 'dark', label: t('reader.bgDark') },
                            { value: 'paper', label: t('reader.bgPaper') },
                        ]}
                        value={bg}
                        onChange={v => onBg(v as Bg)}
                        size="sm"
                    />
                </div>

                <div className="h-px bg-mr-border" />

                <div>
                    <p className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('reader.shortcutsSection')}</p>
                    <table className="w-full text-mr-tiny">
                        <tbody className="divide-y divide-mr-border">
                            {KEYBOARD_SHORTCUTS.map(({ keys, id }) => (
                                <tr key={id}>
                                    <td className="py-1.5">
                                        <span className="flex items-center gap-1">
                                            {keys.map(k => (
                                                <Kbd key={k} size="sm">
                                                    {k}
                                                </Kbd>
                                            ))}
                                        </span>
                                    </td>
                                    <td className="py-1.5 text-mr-fg-muted">{t(`reader.shortcuts.${id}`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Drawer>
    );
};
