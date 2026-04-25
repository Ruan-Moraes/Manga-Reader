import { FormEvent, useCallback, useState } from 'react';
import i18next from 'i18next';

import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';

import { getStoredSession } from '@feature/auth/service/authService';

import {
    submitPublishWorkContact,
    type PublishWorkRequest,
} from '@feature/contact';

type PublishWorkDraft = {
    name: string;
    email: string;
    workType: string;
    workTitle: string;
    synopsis: string;
    portfolioLink: string;
    message: string;
};

type FormErrors = Partial<Record<keyof PublishWorkDraft, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

const buildInitialDraft = (): PublishWorkDraft => {
    const session = getStoredSession();

    return {
        name: session?.name ?? '',
        email: session?.email ?? '',
        workType: '',
        workTitle: '',
        synopsis: '',
        portfolioLink: '',
        message: '',
    };
};

const usePublishWorkForm = () => {
    const [draft, setDraft] = useState<PublishWorkDraft>(buildInitialDraft);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = useCallback(
        <K extends keyof PublishWorkDraft>(
            field: K,
            value: PublishWorkDraft[K],
        ) => {
            setDraft(prev => ({ ...prev, [field]: value }));
            setErrors(prev => {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            });
        },
        [],
    );

    const validate = useCallback((): FormErrors => {
        const e: FormErrors = {};
        const t = (key: string) =>
            i18next.t(key, { ns: 'contact' }) as string;

        if (!draft.name.trim()) {
            e.name = t('form.errors.nameRequired');
        }

        if (draft.name.trim().length < 2) {
            e.name = t('form.errors.nameMin');
        } else if (!draft.email.trim()) {
            e.email = t('form.errors.emailRequired');
        }

        if (!EMAIL_REGEX.test(draft.email.trim())) {
            e.email = t('form.errors.emailInvalid');
        }

        if (!draft.workType) {
            e.workType = t('form.errors.workTypeRequired');
        }

        if (!draft.workTitle.trim()) {
            e.workTitle = t('form.errors.workTitleRequired');
        }

        if (draft.workTitle.trim().length < 2) {
            e.workTitle = t('form.errors.workTitleMin');
        }

        if (!draft.synopsis.trim()) {
            e.synopsis = t('form.errors.synopsisRequired');
        }

        if (draft.synopsis.trim().length < 10) {
            e.synopsis = t('form.errors.synopsisMin');
        }

        if (draft.synopsis.trim().length > 2000) {
            e.synopsis = t('form.errors.synopsisMax');
        }

        if (
            draft.portfolioLink.trim() &&
            !URL_REGEX.test(draft.portfolioLink.trim())
        ) {
            e.portfolioLink = t('form.errors.portfolioLinkInvalid');
        }

        if (!draft.message.trim()) {
            e.message = t('form.errors.messageRequired');
        }

        if (draft.message.trim().length < 10) {
            e.message = t('form.errors.messageMin');
        }

        if (draft.message.trim().length > 5000) {
            e.message = t('form.errors.messageMax');
        }

        return e;
    }, [draft]);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast(
                    i18next.t('form.toasts.validationFailed', {
                        ns: 'contact',
                    }),
                    {
                        toastId: 'publish-work-validation',
                    },
                );

                return;
            }

            setIsSubmitting(true);

            try {
                const payload: PublishWorkRequest = {
                    name: draft.name.trim(),
                    email: draft.email.trim(),
                    workType: draft.workType,
                    workTitle: draft.workTitle.trim(),
                    synopsis: draft.synopsis.trim(),
                    portfolioLink: draft.portfolioLink.trim() || undefined,
                    message: draft.message.trim(),
                };

                const responseMessage = await submitPublishWorkContact(payload);

                showSuccessToast(
                    responseMessage ??
                        i18next.t('form.toasts.success', { ns: 'contact' }),
                    { toastId: 'publish-work-success' },
                );

                setDraft(buildInitialDraft());

                setErrors({});
            } finally {
                setIsSubmitting(false);
            }
        },
        [draft, validate],
    );

    return {
        draft,
        errors,
        isSubmitting,
        updateField,
        handleSubmit,
    };
};

export default usePublishWorkForm;
