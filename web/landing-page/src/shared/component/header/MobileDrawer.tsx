import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import LanguageSwitcher from '@/shared/component/LanguageSwitcher';
import ThemeSwitcher from '@/shared/component/ThemeSwitcher';
import { useBodyScrollLock } from '@/shared/hook/useBodyScrollLock';
import { NavLinks } from './NavLinks';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
    onNav: (id: string) => void;
    drawerId: string;
}

export function MobileDrawer({
    open,
    onClose,
    onNav,
    drawerId,
}: MobileDrawerProps) {
    const { t } = useTranslation();
    const drawerRef = useRef<HTMLDivElement>(null);

    useBodyScrollLock(open);

    useEffect(() => {
        if (!open) return;

        const drawer = drawerRef.current;
        const focusable = drawer?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        focusable?.[0]?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !focusable?.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] bg-overlay"
            onMouseDown={() => onClose()}
        >
            <div
                ref={drawerRef}
                id={drawerId}
                role="dialog"
                aria-modal="true"
                aria-label={t('nav.mobile')}
                className="ml-auto flex min-h-full w-[min(88vw,360px)] flex-col gap-5 border-l border-border bg-secondary p-6 shadow-[-18px_0_40px_rgb(0_0_0_/_35%)]"
                onMouseDown={event => event.stopPropagation()}
            >
                <div className="grid">
                    <NavLinks variant="drawer" onNav={onNav} />
                </div>
                <LanguageSwitcher variant="drawer" />
                <ThemeSwitcher variant="drawer" />
                <Button
                    size="lg"
                    className="w-full"
                    onClick={() => onNav('plans')}
                >
                    {t('cta.subscribe')}
                </Button>
            </div>
        </div>
    );
}
