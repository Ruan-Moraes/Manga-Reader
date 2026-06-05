import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { Input } from '@ui/Input';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import useEventFormModalState from '../../model/useEventFormModalState';
import FormModal from './FormModal';

import type { AdminEvent, CreateEventRequest, UpdateEventRequest } from '../../model/admin.types';

type EventFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEventRequest | UpdateEventRequest) => void;
    event?: AdminEvent | null;
    isSubmitting: boolean;
};

const EventFormModal = ({ isOpen, onClose, onSubmit, event, isSubmitting }: EventFormModalProps) => {
    const { t } = useTranslation('admin');
    const {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        timeline,
        setTimeline,
        status,
        setStatus,
        type,
        setType,
        image,
        setImage,
        locationLabel,
        setLocationLabel,
        locationCity,
        setLocationCity,
        locationIsOnline,
        setLocationIsOnline,
        organizerName,
        setOrganizerName,
        priceLabel,
        setPriceLabel,
        isFeatured,
        setIsFeatured,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        description,
        setDescription,
        ptTitle,
        handleSubmit,
    } = useEventFormModalState(event, isOpen, onSubmit);

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={event ? t('eventForm.editTitle', 'Editar Evento') : t('eventForm.newTitle', 'Novo Evento')}
            onSubmit={handleSubmit}
            submitLabel={t('common.save', 'Salvar')}
            submittingLabel={t('common.saving', 'Salvando...')}
            cancelLabel={t('common.cancel', 'Cancelar')}
            isSubmitting={isSubmitting}
            submitDisabled={!ptTitle || !startDate || !endDate}
        >
            <LocalizedTextInput label={t('eventForm.title', 'Título')} value={title} onChange={setTitle} maxLength={200} />

            <LocalizedTextInput label={t('eventForm.subtitle', 'Subtítulo')} value={subtitle} onChange={setSubtitle} requiredLanguages={[]} maxLength={500} />

            <LocalizedTextInput
                label={t('eventForm.description', 'Descrição')}
                value={description}
                onChange={setDescription}
                multiline
                rows={5}
                requiredLanguages={[]}
            />

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.startDate', 'Início (ISO local)')}</span>
                <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.endDate', 'Fim (ISO local)')}</span>
                <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.timeline', 'Timeline')}</span>
                <Input type="text" value={timeline} onChange={e => setTimeline(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.status', 'Status')}</span>
                <Input type="text" value={status} onChange={e => setStatus(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.type', 'Tipo')}</span>
                <Input type="text" value={type} onChange={e => setType(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.image', 'Imagem (URL)')}</span>
                <Input type="text" value={image} onChange={e => setImage(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.locationLabel', 'Local')}</span>
                <Input type="text" value={locationLabel} onChange={e => setLocationLabel(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.locationCity', 'Cidade')}</span>
                <Input type="text" value={locationCity} onChange={e => setLocationCity(e.target.value)} />
            </div>

            <Checkbox label={t('eventForm.online', 'Online')} checked={locationIsOnline} onChange={e => setLocationIsOnline(e.target.checked)} />

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.organizer', 'Organizador')}</span>
                <Input type="text" value={organizerName} onChange={e => setOrganizerName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('eventForm.price', 'Preço (label)')}</span>
                <Input type="text" value={priceLabel} onChange={e => setPriceLabel(e.target.value)} />
            </div>

            <Checkbox label={t('eventForm.featured', 'Destaque')} checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
        </FormModal>
    );
};

export default EventFormModal;
