import { z } from 'zod';

type Translator = (key: string) => string;

export const buildLoginSchema = (t: Translator) =>
    z.object({
        email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
        password: z.string().min(1, t('validation.passwordRequired')),
    });

export type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;

export const buildSignUpSchema = (t: Translator) =>
    z.object({
        name: z.string().min(1, t('validation.nameRequired')).min(2, t('validation.nameMin')),
        email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
        password: z.string().min(1, t('validation.passwordRequired')).min(8, t('validation.passwordMin')),
        accept: z.boolean().refine(v => v === true, { message: t('validation.acceptTermsAndDmca') }),
    });

export type SignUpFormValues = z.infer<ReturnType<typeof buildSignUpSchema>>;
