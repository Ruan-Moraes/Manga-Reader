import { useState } from 'react';
import {
    MessageCircle,
    Mail,
    Shield,
    Copyright,
    AlertTriangle,
    Headphones,
    BookOpen,
} from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { LegalShell } from './_components/LegalShell';
import { LegalCrossLinks } from './_components/LegalCrossLinks';
import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { Label } from '@ui/Label';
import { Button } from '@ui/Button';

const CHANNEL_META = [
    { key: 'general', icon: MessageCircle, priority: false },
    { key: 'content', icon: BookOpen, priority: false },
    { key: 'privacy', icon: Shield, priority: false },
    { key: 'dmca', icon: Copyright, priority: false },
    { key: 'billing', icon: Headphones, priority: false },
    { key: 'priority', icon: AlertTriangle, priority: true },
] as const;

const TOPIC_KEYS = [
    'general',
    'content',
    'privacy',
    'dmca',
    'billing',
    'priority',
] as const;

const SUBMIT_DELAY_MS = 1000;

type Status = 'idle' | 'submitting' | 'sent';

type Row = { term: string; value: string };

export default function Contact() {
    const { t } = useTranslation('legal');

    const [form, setForm] = useState({
        name: '',
        email: '',
        topic: '',
        message: '',
    });
    const [errors, setErrors] = useState<
        Partial<Record<keyof typeof form, string>>
    >({});
    const [status, setStatus] = useState<Status>('idle');

    const set =
        (key: keyof typeof form) =>
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => setForm(f => ({ ...f, [key]: e.target.value }));

    const validate = () => {
        const e: typeof errors = {};

        if (!form.name.trim()) e.name = t('contact.form.errors.nameRequired');
        if (!form.email.trim())
            e.email = t('contact.form.errors.emailRequired');
        else if (!/\S+@\S+\.\S+/.test(form.email))
            e.email = t('contact.form.errors.emailInvalid');
        if (!form.topic) e.topic = t('contact.form.errors.topicRequired');
        if (!form.message.trim())
            e.message = t('contact.form.errors.messageRequired');
        else if (form.message.trim().length < 10)
            e.message = t('contact.form.errors.messageTooShort');

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

    const topicOptions = [
        {
            value: '',
            label: t('contact.form.topics.placeholder'),
            disabled: true,
        },
        ...TOPIC_KEYS.map(key => ({
            value: key,
            label: t(`contact.form.topics.${key}`),
        })),
    ];

    const postalRows = t('contact.postal.rows', {
        returnObjects: true,
    }) as Row[];

    return (
        <LegalShell
            page="contact"
            title={t('contact.title')}
            sub={t('contact.sub')}
            updated={t('contact.updated')}
            toc={null}
        >
            {/* Section 1 — Channels */}
            <section className="mb-10">
                <h2 className="mb-4 text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">
                    {t('contact.channelsTitle')}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {CHANNEL_META.map(ch => {
                        const Icon = ch.icon;

                        const title = t(`contact.channels.${ch.key}.title`);
                        const label = t(`contact.channels.${ch.key}.label`);
                        const desc = t(`contact.channels.${ch.key}.desc`);
                        const email = t(`contact.channels.${ch.key}.email`);
                        const sla = t(`contact.channels.${ch.key}.sla`);

                        return (
                            <article
                                key={ch.key}
                                aria-label={t('contact.channelAriaLabel', {
                                    name: title,
                                })}
                                className="flex flex-col gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-4"
                            >
                                <header className="flex items-center gap-3">
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-mr-xs ${ch.priority ? 'bg-[rgba(255,120,79,0.12)] text-mr-danger' : 'bg-mr-accent-25 text-mr-accent'}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <div>
                                        <p className="mr-label text-mr-fg-subtle">
                                            {label}
                                        </p>
                                        <p className="text-mr-small font-mr-extrabold text-mr-fg">
                                            {title}
                                        </p>
                                    </div>
                                </header>
                                <p className="text-mr-tiny text-mr-fg-muted">
                                    {desc}
                                </p>
                                <a
                                    href={`mailto:${email}`}
                                    className="inline-flex items-center gap-1.5 self-start rounded-mr-full border border-mr-border px-3 py-1 text-mr-tiny text-mr-accent hover:border-mr-accent transition-colors"
                                >
                                    <Mail className="size-3" />
                                    {email}
                                </a>
                                <p className="text-mr-tiny text-mr-fg-subtle">
                                    {t('contact.slaLabel')}{' '}
                                    <strong className="text-mr-fg">{sla}</strong>
                                </p>
                                {ch.priority && (
                                    <p className="text-mr-tiny text-mr-danger">
                                        {t('contact.priorityWarning')}
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Section 2 — Form */}
            <section className="mb-10">
                <h2 className="mb-1 text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">
                    {t('contact.form.title')}
                </h2>
                <p className="mb-6 text-mr-small text-mr-fg-muted">
                    {t('contact.form.sub')}
                </p>

                {status === 'sent' ? (
                    <div
                        role="status"
                        className="flex flex-col items-center gap-4 py-10 text-center"
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}/illustrations/feliz.png`}
                            alt=""
                            className="h-28 w-auto"
                        />
                        <div>
                            <p className="text-mr-h3 font-mr-extrabold text-mr-fg">
                                {t('contact.form.success.heading')}
                            </p>
                            <p className="mt-1 text-mr-body text-mr-fg-muted">
                                <Trans
                                    i18nKey="contact.form.success.body"
                                    ns="legal"
                                    values={{ email: form.email }}
                                    components={{ strong: <strong /> }}
                                />
                            </p>
                        </div>
                        <Button variant="ghost" onClick={reset}>
                            {t('contact.form.success.again')}
                        </Button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="flex flex-col gap-4"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="contact-name" required>
                                    {t('contact.form.name')}
                                </Label>
                                <Input
                                    id="contact-name"
                                    placeholder={t(
                                        'contact.form.namePlaceholder',
                                    )}
                                    value={form.name}
                                    onChange={set('name')}
                                    error={errors.name}
                                />
                            </div>
                            <div>
                                <Label htmlFor="contact-email" required>
                                    {t('contact.form.email')}
                                </Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    placeholder={t(
                                        'contact.form.emailPlaceholder',
                                    )}
                                    value={form.email}
                                    onChange={set('email')}
                                    error={errors.email}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="contact-topic" required>
                                {t('contact.form.topic')}
                            </Label>
                            <Select
                                id="contact-topic"
                                value={form.topic}
                                onChange={set('topic')}
                                options={topicOptions}
                                error={errors.topic}
                            />
                        </div>

                        <div>
                            <Label htmlFor="contact-message" required>
                                {t('contact.form.message')}
                            </Label>
                            <Textarea
                                id="contact-message"
                                placeholder={t(
                                    'contact.form.messagePlaceholder',
                                )}
                                value={form.message}
                                onChange={set('message')}
                                error={errors.message}
                                rows={5}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <p className="text-mr-tiny text-mr-fg-subtle">
                                {t('contact.form.responseTime')}{' '}
                                <strong className="text-mr-fg">
                                    {t('contact.form.responseTimeValue')}
                                </strong>
                            </p>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={status === 'submitting'}
                            >
                                {t('contact.form.submit')}
                            </Button>
                        </div>
                    </form>
                )}
            </section>

            {/* Section 3 — Postal */}
            <section className="mb-10">
                <h2 className="mb-4 text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">
                    {t('contact.postal.title')}
                </h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {postalRows.map(row => (
                        <div
                            key={row.term}
                            className="rounded-mr-sm border border-mr-border bg-mr-surface p-4"
                        >
                            <dt className="mr-label text-mr-accent uppercase tracking-[0.08em]">
                                {row.term}
                            </dt>
                            <dd className="mt-2 whitespace-pre-line text-mr-small text-mr-fg-muted">
                                {row.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            <LegalCrossLinks current="contact" />
        </LegalShell>
    );
}
