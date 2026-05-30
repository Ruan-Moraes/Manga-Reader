import { useTranslation } from 'react-i18next';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';

type Props = {
    submitting: boolean;
    onCancel: () => void;
    onSubmit: () => void;
};

const ComposerActions = ({ submitting, onCancel, onSubmit }: Props) => {
    const { t } = useTranslation('forum');

    return (
        <div className="flex items-center justify-between border-t border-mr-border pt-4">
            <div className="flex items-center gap-2 text-mr-tiny text-mr-fg-subtle">
                <Badge variant="neutral">⌘ Enter</Badge>
                <span>{t('composer.publishShortcut')}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onCancel}>
                    {t('composer.cancelButton')}
                </Button>
                <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                    {submitting ? t('composer.publishingButton') : t('composer.publishButton')}
                </Button>
            </div>
        </div>
    );
};

export default ComposerActions;
