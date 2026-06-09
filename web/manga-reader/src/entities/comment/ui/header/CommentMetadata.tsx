import { useTranslation } from 'react-i18next';

import { formatDate } from '@shared/lib/formatters';

type CommentMetadataProps = {
    createdAt: string;
    edited: boolean;
};

const CommentMetadata = ({ createdAt, edited }: CommentMetadataProps) => {
    const { t } = useTranslation('comment');

    return (
        <div className="flex justify-end gap-2 text-[0.5625rem]">
            <div className="px-2 py-1 rounded-xs shadow-lg bg-primary-default">
                <span className="text-shadow-default">
                    {formatDate(createdAt, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                    })}
                </span>
            </div>
            {edited && (
                <div className="px-2 py-1 rounded-xs shadow-lg bg-primary-default">
                    <span className=" text-shadow-default">{t('metadata.edited')}</span>
                </div>
            )}
        </div>
    );
};

export default CommentMetadata;
