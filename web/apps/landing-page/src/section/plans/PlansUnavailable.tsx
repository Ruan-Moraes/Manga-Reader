import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import Reveal from '@/shared/component/Reveal';

interface PlansUnavailableProps {
    isFetching: boolean;
    onRetry: () => void;
}

export function PlansUnavailable({
    isFetching,
    onRetry,
}: PlansUnavailableProps) {
    const { t } = useTranslation();

    return (
        <Reveal className="min-[720px]:col-span-2 lg:col-span-3">
            <div
                role="status"
                aria-live="polite"
                aria-busy={isFetching}
                className="mx-auto flex max-w-[680px] flex-col items-center rounded-[14px] border border-accent-muted bg-[linear-gradient(180deg,var(--color-accent-5),var(--color-card))] px-6 py-10 text-center shadow-[var(--shadow-floating)] sm:px-10"
            >
                <span className="mb-5 grid size-12 place-items-center rounded-full border border-accent-muted bg-accent-subtle text-accent-fg">
                    <Icon name="sync" size={22} />
                </span>
                <h3 className="m-0 text-xl font-extrabold text-fg sm:text-2xl">
                    {t('plans.unavailableTitle')}
                </h3>
                <p className="mt-3 max-w-[560px] text-sm leading-6 text-copy sm:text-base sm:leading-7">
                    {t('plans.unavailableDescription')}
                </p>
                <Button
                    className="mt-6"
                    variant="outline"
                    icon={<Icon name="sync" size={17} />}
                    disabled={isFetching}
                    onClick={onRetry}
                >
                    {t('plans.retry')}
                </Button>
            </div>
        </Reveal>
    );
}
