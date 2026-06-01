import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SUBMIT_DELAY_MS = 1000;

export type ContactStatus = 'idle' | 'submitting' | 'sent';

type ContactForm = { name: string; email: string; topic: string; message: string };

type FieldEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/**
 * State + validation + submit for the Contact form. No backend yet — submission
 * is simulated (`SUBMIT_DELAY_MS`); swap the body of `handleSubmit` when the API
 * lands. Page hook (single consumer: `pages/legal/ui/Contact`).
 */
export default function useContactForm() {
    const { t } = useTranslation('legal');

    const [form, setForm] = useState<ContactForm>({ name: '', email: '', topic: '', message: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
    const [status, setStatus] = useState<ContactStatus>('idle');

    const set = (key: keyof ContactForm) => (e: FieldEvent) => setForm(f => ({ ...f, [key]: e.target.value }));

    const validate = () => {
        const e: Partial<Record<keyof ContactForm, string>> = {};

        if (!form.name.trim()) e.name = t('contact.form.errors.nameRequired');

        if (!form.email.trim()) e.email = t('contact.form.errors.emailRequired');
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('contact.form.errors.emailInvalid');

        if (!form.topic) e.topic = t('contact.form.errors.topicRequired');

        if (!form.message.trim()) e.message = t('contact.form.errors.messageRequired');
        else if (form.message.trim().length < 10) e.message = t('contact.form.errors.messageTooShort');

        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errs = validate();

        setErrors(errs);

        if (Object.keys(errs).length > 0) return;

        setStatus('submitting');

        await new Promise(r => setTimeout(r, SUBMIT_DELAY_MS));

        setStatus('sent');
    };

    const reset = () => {
        setForm({ name: '', email: '', topic: '', message: '' });
        
        setErrors({});

        setStatus('idle');
    };

    return { form, errors, status, set, handleSubmit, reset };
}
