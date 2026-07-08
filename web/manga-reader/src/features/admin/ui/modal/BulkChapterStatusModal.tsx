import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Select } from '@ui/Select';
import { CHAPTER_STATUSES, type BulkResult, type ChapterStatus } from '@entities/chapter';

import Field from '../parts/Field';

type BulkChapterStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    count: number;
    isSubmitting: boolean;
    onConfirm: (status: ChapterStatus) => Promise<BulkResult | null>;
};

/** Mudança de status em lote com relatório de resultado parcial por item. */
const BulkChapterStatusModal = ({ isOpen, onClose, count, isSubmitting, onConfirm }: BulkChapterStatusModalProps) => {
    const { t } = useTranslation('admin');
    const [status, setStatus] = useState<ChapterStatus>('published');
    const [result, setResult] = useState<BulkResult | null>(null);

    const close = () => {
        setResult(null);
        onClose();
    };

    const handleConfirm = async () => {
        const bulkResult = await onConfirm(status);
        // Sucesso total fecha direto; falhas parciais ficam detalhadas no modal.
        if (bulkResult && bulkResult.failed.length > 0) setResult(bulkResult);
        else close();
    };

    return (
        <Modal
            open={isOpen}
            onClose={close}
            title={t('dashboard.chapters.bulk.statusTitle')}
            size="sm"
            loading={isSubmitting}
            footer={
                result ? (
                    <Button variant="primary" size="sm" onClick={close}>
                        {t('common.close')}
                    </Button>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" onClick={close}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" size="sm" loading={isSubmitting} onClick={handleConfirm}>
                            {t('dashboard.chapters.bulk.apply', { count })}
                        </Button>
                    </>
                )
            }
        >
            <div className="flex flex-col gap-3.5">
                {result ? (
                    <>
                        <p className="text-mr-small text-mr-fg">{t('dashboard.chapters.bulk.partialSummary', { ok: result.succeeded.length, failed: result.failed.length })}</p>
                        <ul className="flex max-h-[40vh] flex-col gap-1.5 overflow-y-auto">
                            {result.failed.map(failure => (
                                <li key={failure.id} className="rounded-mr-xs border border-[rgba(255,120,79,0.4)] bg-mr-danger-15 px-3 py-2 text-mr-tiny text-mr-fg">
                                    <span className="font-mr-mono text-mr-fg-subtle">{failure.id.slice(0, 10)}</span>{' '}
                                    <span className="text-mr-danger">{t(`dashboard.chapters.errors.${failure.error.code}`, { ...failure.error })}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <Field label={t('dashboard.chapters.bulk.statusLabel')}>
                        <Select
                            value={status}
                            onChange={e => setStatus(e.target.value as ChapterStatus)}
                            options={CHAPTER_STATUSES.map(s => ({ value: s, label: t(`dashboard.status.chapter.${s}`) }))}
                            aria-label={t('dashboard.chapters.bulk.statusLabel')}
                        />
                    </Field>
                )}
            </div>
        </Modal>
    );
};

export default BulkChapterStatusModal;
