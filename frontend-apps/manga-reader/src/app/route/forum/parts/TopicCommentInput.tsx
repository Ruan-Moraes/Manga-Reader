import { useTranslation } from 'react-i18next';
import { Button } from '@ui/Button';
import { Textarea } from '@ui/Textarea';
import { Label } from '@ui/Label';

type Props = {
    value: string;
    onChange: (v: string) => void;
};

const TopicCommentInput = ({ value, onChange }: Props) => {
    const { t } = useTranslation('forum');

    return (
        <div className="mt-8 rounded-mr-md border border-mr-border bg-mr-surface p-4">
            <Label htmlFor="forum-reply">{t('topic.replyLabel')}</Label>
            <Textarea
                id="forum-reply"
                placeholder={t('topic.commentPlaceholder')}
                rows={4}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="mt-1"
            />
            <div className="mt-3 flex justify-end">
                <Button variant="primary" disabled={!value.trim()}>
                    {t('composer.publishButton')}
                </Button>
            </div>
        </div>
    );
};

export default TopicCommentInput;
