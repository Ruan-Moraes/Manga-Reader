import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, ConfirmDialog } from '@/shared/ui';

import { ChapterBatchPanel } from './ChapterBatchPanel';

interface Props {
    visible: boolean;
    onClose(): void;
    closeLabel: string;
    title: string;
    description?: string;
    projectId: string;
    onOpenReader?(projectId: string): void;
}

/**
 * Batch of one chapter in a sheet (work screen and reader retries). Closing the sheet unmounts the batch, which
 * interrupts the page in flight, so while sending it asks first instead of closing silently (2026-11-10).
 */
export function BatchRetrySheet({ visible, onClose, closeLabel, title, description, projectId, onOpenReader }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const [busy, setBusy] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const requestClose = () => (busy ? setConfirmClose(true) : onClose());
    return (
        <>
            <BottomSheet visible={visible} onClose={requestClose} closeLabel={closeLabel} title={title} description={description}>
                {visible ? <ChapterBatchPanel projectId={projectId} onActivityChange={setBusy} onOpenReader={onOpenReader} /> : null}
            </BottomSheet>
            <ConfirmDialog
                visible={confirmClose}
                onClose={() => setConfirmClose(false)}
                onConfirm={onClose}
                closeLabel={t('batch.keepSending')}
                cancelLabel={t('batch.keepSending')}
                confirmLabel={t('batch.closeConfirm')}
                title={t('batch.closeTitle')}
                description={t('batch.closeDescription')}
                icon="warning-outline"
            />
        </>
    );
}
