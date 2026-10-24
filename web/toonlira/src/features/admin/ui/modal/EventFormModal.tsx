import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Button } from '@ui/Button';
import { Switch } from '@ui/Switch';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';

import useEventFormModalState from '../../model/useEventFormModalState';
import { FormRow } from '@ui/FormRow';
import Field from '../parts/Field';

import type { AdminEvent, CreateEventRequest, UpdateEventRequest } from '../../model/admin.types';

type EventFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEventRequest | UpdateEventRequest) => void;
    event?: AdminEvent | null;
    isSubmitting: boolean;
    onDelete?: () => void;
};


const EventFormModal = ({ isOpen, onClose, onSubmit, event, isSubmitting, onDelete }: EventFormModalProps) => {
    const { t } = useTranslation('admin');
    const { data: timelineOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TIMELINE);
    const { data: statusOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_STATUS);
    const { data: typeOptions = [] } = useDomainLabels(LABEL_TYPES.EVENT_TYPE);

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
        dirty,
        handleSubmit,
    } = useEventFormModalState(event, isOpen, onSubmit);

    const isEditing = Boolean(event);
    const save = () => handleSubmit({ preventDefault: () => {} } as React.FormEvent);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={event ? t('eventForm.editTitle', 'Editar Evento') : t('eventForm.newTitle', 'Novo Evento')}
            description={t('dashboard.events.form.modalSubtitle')}
            size="xl"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel', 'Cancelar')}
                    onCancel={onClose}
                    submitLabel={t('common.save', 'Salvar')}
                    onSubmit={save}
                    submitDisabled={!ptTitle || !startDate || !endDate}
                    submitting={isSubmitting}
                    leftAction={
                        isEditing &&
                        onDelete && (
                            <Button variant="ghost" size="sm" danger icon={Trash2} onClick={onDelete}>
                                {t('common.delete')}
                            </Button>
                        )
                    }
                />
            }
        >
            <div className="flex flex-col gap-4">
                <LocalizedTextInput label={t('eventForm.title', 'Título')} value={title} onChange={setTitle} maxLength={200} />
                <LocalizedTextInput label={t('eventForm.subtitle', 'Subtítulo')} value={subtitle} onChange={setSubtitle} requiredLanguages={[]} maxLength={500} />
                <LocalizedTextInput label={t('eventForm.description', 'Descrição')} value={description} onChange={setDescription} multiline rows={4} requiredLanguages={[]} />

                <FormRow columns={2}>
                    <Field label={t('eventForm.startDate', 'Início')}>
                        <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </Field>
                    <Field label={t('eventForm.endDate', 'Fim')}>
                        <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </Field>
                </FormRow>

                <FormRow columns={3}>
                    <Field label={t('eventForm.timeline', 'Timeline')}>
                        <Select value={timeline} onChange={e => setTimeline(e.target.value)} options={timelineOptions} />
                    </Field>
                    <Field label={t('eventForm.status', 'Status')}>
                        <Select value={status} onChange={e => setStatus(e.target.value)} options={statusOptions} />
                    </Field>
                    <Field label={t('eventForm.type', 'Tipo')}>
                        <Select value={type} onChange={e => setType(e.target.value)} options={typeOptions} />
                    </Field>
                </FormRow>

                <FormRow columns={2}>
                    <Field label={t('eventForm.locationLabel', 'Local')}>
                        <Input type="text" value={locationLabel} onChange={e => setLocationLabel(e.target.value)} />
                    </Field>
                    <Field label={t('eventForm.locationCity', 'Cidade')}>
                        <Input type="text" value={locationCity} onChange={e => setLocationCity(e.target.value)} />
                    </Field>
                </FormRow>

                <FormRow columns={3}>
                    <Field label={t('eventForm.organizer', 'Organizador')}>
                        <Input type="text" value={organizerName} onChange={e => setOrganizerName(e.target.value)} />
                    </Field>
                    <Field label={t('eventForm.price', 'Preço')}>
                        <Input type="text" value={priceLabel} onChange={e => setPriceLabel(e.target.value)} />
                    </Field>
                    <Field label={t('eventForm.image', 'Imagem (URL)')}>
                        <Input type="text" placeholder="https://..." value={image} onChange={e => setImage(e.target.value)} />
                    </Field>
                </FormRow>

                <div className="flex flex-wrap gap-x-7 gap-y-3 pt-1">
                    <Switch label={t('eventForm.online', 'Online')} checked={locationIsOnline} onChange={setLocationIsOnline} />
                    <Switch label={t('eventForm.featured', 'Destaque')} checked={isFeatured} onChange={setIsFeatured} />
                </div>
            </div>
        </Modal>
    );
};

export default EventFormModal;
