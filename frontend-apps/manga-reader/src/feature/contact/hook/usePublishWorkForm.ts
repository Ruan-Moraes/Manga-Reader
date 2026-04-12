import { FormEvent, useCallback, useState } from 'react';

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

        if (!draft.name.trim()) {
            e.name = 'Nome é obrigatório.';
        }

        if (draft.name.trim().length < 2) {
            e.name = 'Nome deve ter pelo menos 2 caracteres.';
        } else if (!draft.email.trim()) {
            e.email = 'Email é obrigatório.';
        }

        if (!EMAIL_REGEX.test(draft.email.trim())) {
            e.email = 'Formato de email inválido.';
        }

        if (!draft.workType) {
            e.workType = 'Tipo de trabalho é obrigatório.';
        }

        if (!draft.workTitle.trim()) {
            e.workTitle = 'Título do trabalho é obrigatório.';
        }

        if (draft.workTitle.trim().length < 2) {
            e.workTitle = 'Título deve ter pelo menos 2 caracteres.';
        }

        if (!draft.synopsis.trim()) {
            e.synopsis = 'Sinopse é obrigatória.';
        }

        if (draft.synopsis.trim().length < 10) {
            e.synopsis = 'Sinopse deve ter pelo menos 10 caracteres.';
        }

        if (draft.synopsis.trim().length > 2000) {
            e.synopsis = 'Sinopse deve ter no máximo 2000 caracteres.';
        }

        if (
            draft.portfolioLink.trim() &&
            !URL_REGEX.test(draft.portfolioLink.trim())
        ) {
            e.portfolioLink = 'URL inválida. Use o formato http:// ou https://';
        }

        if (!draft.message.trim()) {
            e.message = 'Mensagem é obrigatória.';
        }

        if (draft.message.trim().length < 10) {
            e.message = 'Mensagem deve ter pelo menos 10 caracteres.';
        }

        if (draft.message.trim().length > 5000) {
            e.message = 'Mensagem deve ter no máximo 5000 caracteres.';
        }

        return e;
    }, [draft]);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const validationErrors = validate();

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length > 0) {
                showErrorToast('Corrija os erros no formulário.', {
                    toastId: 'publish-work-validation',
                });

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
                        'Sua solicitação foi enviada com sucesso!',
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
