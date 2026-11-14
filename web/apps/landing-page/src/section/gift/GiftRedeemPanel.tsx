import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import { appHref } from '@/shared/config/appLinks';

export function GiftRedeemPanel() {
    const { t } = useTranslation();
    const [code, setCode] = useState('');

    function handleSubmit(event?: FormEvent) {
        event?.preventDefault();
        const trimmed = code.trim();
        window.location.href = appHref(
            '/subscription/redeem',
            trimmed ? { code: trimmed } : undefined,
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[460px] animate-fade rounded-[14px] border border-border bg-card p-7 text-center"
        >
            <span className="mb-4 inline-flex size-[52px] items-center justify-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg">
                <Icon name="ticket" size={24} />
            </span>
            <label
                className="mb-2.5 block text-[0.875rem] font-extrabold text-copy"
                htmlFor="gift-code"
            >
                {t('gift.redeemLabel')}
            </label>
            <input
                id="gift-code"
                type="text"
                className="mb-3.5 h-[50px] w-full rounded-[10px] border border-line bg-primary px-3.5 text-center font-extrabold tracking-[0.12em] text-fg uppercase outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-tertiary focus:border-accent-border focus:shadow-[0_0_0_3px_rgb(221_218_42_/_10%)]"
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder={t('gift.redeemPlaceholder')}
            />
            <Button
                type="submit"
                size="lg"
                className="w-full"
                onClick={() => handleSubmit()}
            >
                {t('gift.redeemCta')}
            </Button>
            <p className="mt-3.5 text-[0.875rem] leading-[1.6] text-copy-muted">
                {t('gift.redeemHint')}
            </p>
        </form>
    );
}
