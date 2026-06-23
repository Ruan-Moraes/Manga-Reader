import { useTranslation } from 'react-i18next';

import { type User } from '@entities/user/@x/comment';
import { Markdown } from '@ui/Markdown';

type CommentContentProps = {
    textContent: string | null;
    imageContent: string | null;

    user: User;
};

const CommentContent = ({ textContent, imageContent, user }: CommentContentProps) => {
    const { t } = useTranslation('comment');

    return (
        <div className="flex flex-col gap-2">
            {textContent && <Markdown text={textContent} className="text-mr-body leading-[1.62] text-mr-fg-muted" />}
            {imageContent && (
                <div>
                    <img
                        src={imageContent}
                        alt={t('user.imageAlt', { name: user.name })}
                        className="object-cover object-center w-full rounded-xs max-h-[30rem]"
                    />
                </div>
            )}
        </div>
    );
};

export default CommentContent;
