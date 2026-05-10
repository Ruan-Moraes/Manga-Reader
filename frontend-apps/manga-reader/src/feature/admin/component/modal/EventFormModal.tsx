import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import BaseInput from '@shared/component/input/BaseInput';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type {
    AdminEvent,
    CreateEventRequest,
    UpdateEventRequest,
} from '../../type/admin.types';

type EventFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEventRequest | UpdateEventRequest) => void;
    event?: AdminEvent | null;
    isSubmitting: boolean;
};

const EventFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    event,
    isSubmitting,
}: EventFormModalProps) => {
    const { t } = useTranslation('admin');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timeline, setTimeline] = useState('UPCOMING');
    const [status, setStatus] = useState('COMING_SOON');
    const [type, setType] = useState('online');
    const [image, setImage] = useState('');
    const [locationLabel, setLocationLabel] = useState('');
    const [locationCity, setLocationCity] = useState('');
    const [locationIsOnline, setLocationIsOnline] = useState(true);
    const [organizerName, setOrganizerName] = useState('');
    const [priceLabel, setPriceLabel] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    const [title, setTitle] = useState<LocalizedString>({});
    const [subtitle, setSubtitle] = useState<LocalizedString>({});
    const [description, setDescription] = useState<LocalizedString>({});

    useEffect(() => {
        if (event) {
            setStartDate(event.startDate.slice(0, 16));
            setEndDate(event.endDate.slice(0, 16));
            setTimeline(event.timeline);
            setStatus(event.status);
            setType(event.type);
            setImage(event.image ?? '');
            setLocationLabel(event.locationLabel ?? '');
            setLocationCity(event.locationCity ?? '');
            setLocationIsOnline(event.locationIsOnline);
            setOrganizerName(event.organizerName ?? '');
            setPriceLabel(event.priceLabel ?? '');
            setIsFeatured(event.isFeatured);
            setTitle(event.title ?? {});
            setSubtitle(event.subtitle ?? {});
            setDescription(event.description ?? {});
        } else {
            setStartDate('');
            setEndDate('');
            setTimeline('UPCOMING');
            setStatus('COMING_SOON');
            setType('online');
            setImage('');
            setLocationLabel('');
            setLocationCity('');
            setLocationIsOnline(true);
            setOrganizerName('');
            setPriceLabel('');
            setIsFeatured(false);
            setTitle({});
            setSubtitle({});
            setDescription({});
        }
    }, [event, isOpen]);

    const ptTitle = (title[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!ptTitle || !startDate || !endDate) return;

        const payload: CreateEventRequest = {
            title,
            startDate,
            endDate,
            timeline,
            status,
            type,
            locationIsOnline,
            isFeatured,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(description).length ? { description } : {}),
            ...(image ? { image } : {}),
            ...(locationLabel ? { locationLabel } : {}),
            ...(locationCity ? { locationCity } : {}),
            ...(organizerName ? { organizerName } : {}),
            ...(priceLabel ? { priceLabel } : {}),
        };

        onSubmit(payload);
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {event
                        ? t('eventForm.editTitle', 'Editar Evento')
                        : t('eventForm.newTitle', 'Novo Evento')}
                </h3>

                <LocalizedTextInput
                    label={t('eventForm.title', 'Título')}
                    value={title}
                    onChange={setTitle}
                    maxLength={200}
                />

                <LocalizedTextInput
                    label={t('eventForm.subtitle', 'Subtítulo')}
                    value={subtitle}
                    onChange={setSubtitle}
                    requiredLanguages={[]}
                    maxLength={500}
                />

                <LocalizedTextInput
                    label={t('eventForm.description', 'Descrição')}
                    value={description}
                    onChange={setDescription}
                    multiline
                    rows={5}
                    requiredLanguages={[]}
                />

                <BaseInput
                    label={t('eventForm.startDate', 'Início (ISO local)')}
                    variant="outlined"
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.endDate', 'Fim (ISO local)')}
                    variant="outlined"
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.timeline', 'Timeline')}
                    variant="outlined"
                    type="text"
                    value={timeline}
                    onChange={e => setTimeline(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.status', 'Status')}
                    variant="outlined"
                    type="text"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.type', 'Tipo')}
                    variant="outlined"
                    type="text"
                    value={type}
                    onChange={e => setType(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.image', 'Imagem (URL)')}
                    variant="outlined"
                    type="text"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.locationLabel', 'Local')}
                    variant="outlined"
                    type="text"
                    value={locationLabel}
                    onChange={e => setLocationLabel(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.locationCity', 'Cidade')}
                    variant="outlined"
                    type="text"
                    value={locationCity}
                    onChange={e => setLocationCity(e.target.value)}
                />

                <BaseCheckbox
                    label={t('eventForm.online', 'Online')}
                    checked={locationIsOnline}
                    onChange={setLocationIsOnline}
                />

                <BaseInput
                    label={t('eventForm.organizer', 'Organizador')}
                    variant="outlined"
                    type="text"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                />

                <BaseInput
                    label={t('eventForm.price', 'Preço (label)')}
                    variant="outlined"
                    type="text"
                    value={priceLabel}
                    onChange={e => setPriceLabel(e.target.value)}
                />

                <BaseCheckbox
                    label={t('eventForm.featured', 'Destaque')}
                    checked={isFeatured}
                    onChange={setIsFeatured}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                        type="submit"
                        disabled={
                            isSubmitting || !ptTitle || !startDate || !endDate
                        }
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.saving', 'Salvando...')
                            : t('common.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default EventFormModal;
