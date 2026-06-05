import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Composer, type ComposerHandle } from '@ui/Composer';

type Props = {
    composerRef?: Ref<ComposerHandle>;
};

const TopicCommentInput = ({ composerRef }: Props) => {
    const { t } = useTranslation('forum');

    return (
        <div className="mt-8">
            <p className="mr-label mb-2">{t('topic.replyLabel')}</p>
            <Composer
                ref={composerRef}
                ariaLabel={t('topic.replyLabel')}
                placeholder={t('topic.commentPlaceholder')}
                submitLabel={t('composer.publishButton')}
                onSubmit={() => {
                    // Fórum ainda em mock — persistência entra ao ligar a API.
                }}
            />
        </div>
    );
};

export default TopicCommentInput;
