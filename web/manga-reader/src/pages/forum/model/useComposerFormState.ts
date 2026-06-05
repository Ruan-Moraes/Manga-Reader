import { ROUTES } from '@shared/constant/ROUTES';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

export type ComposerCategory = 'discussion' | 'spoiler' | 'question' | 'news' | 'other';

const DRAFT_KEY = 'forum-draft';

const useComposerFormState = () => {
    const { t } = useTranslation('forum');
    const navigate = useAppNavigate();

    const [category, setCategory] = useState<ComposerCategory | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [preview, setPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        try {
            const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
            if (draft) {
                setCategory(draft.category ?? null);
                setTitle(draft.title ?? '');
                setContent(draft.content ?? '');
                setIsSpoiler(draft.isSpoiler ?? false);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            if (title || content) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ category, title, content, isSpoiler }));
            }
        }, 3000);
        return () => clearInterval(id);
    }, [category, title, content, isSpoiler]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!category) errs.category = t('composer.validation.categoryRequired');
        if (title.length < 10 || title.length > 120) errs.title = t('composer.validation.titleLength');
        if (content.length < 30) errs.content = t('composer.validation.contentLength');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setSubmitting(true);
        setTimeout(() => {
            localStorage.removeItem(DRAFT_KEY);
            navigate(ROUTES.FORUM);
        }, 800);
    };

    return {
        category,
        setCategory,
        title,
        setTitle,
        content,
        setContent,
        isSpoiler,
        setIsSpoiler,
        preview,
        setPreview,
        submitting,
        errors,
        setErrors,
        handleSubmit,
        navigate,
    };
};

export default useComposerFormState;
