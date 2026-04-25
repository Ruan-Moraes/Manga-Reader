import { useTranslation } from 'react-i18next';

import { type User } from '@feature/user';
import { parseMarkdown } from '@shared/service/util/markdownService';

type CommentContentProps = {
    textContent: string | null;
    imageContent: string | null;

    user: User;
};

const CommentContent = ({
    textContent,
    imageContent,
    user,
}: CommentContentProps) => {
    const { t } = useTranslation('comment');

    return (
        <div className="flex flex-col gap-2">
            {textContent && (
                <div
                    className="text-xs text-justify comment-markdown"
                    dangerouslySetInnerHTML={{
                        __html: parseMarkdown(textContent),
                    }}
                />
            )}
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
