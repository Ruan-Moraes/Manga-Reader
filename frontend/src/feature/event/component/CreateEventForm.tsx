import BaseInput from '@shared/component/input/BaseInput';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseSelect from '@shared/component/input/BaseSelect';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';

import { eventTypes } from '../service/eventService';
import type { DraftEvent } from '../hook/useEventForm';
import type { EventType } from '../type/event.types';
import type { FormEvent } from 'react';

type CreateEventFormProps = {
    draftEvent: DraftEvent;
    updateDraftField: <K extends keyof DraftEvent>(
        field: K,
        value: DraftEvent[K],
    ) => void;
    toggleDraft: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

const EVENT_TYPE_OPTIONS = eventTypes.map(item => ({
    value: item,
    label: item,
}));

const PRIVACY_OPTIONS = [
    { value: 'public', label: 'Público' },
    { value: 'members', label: 'Restrito a membros' },
];

const CreateEventForm = ({
    draftEvent,
    updateDraftField,
    toggleDraft,
    onSubmit,
    onCancel,
}: CreateEventFormProps) => (
    <section className="p-5 space-y-4 border rounded-2xl bg-secondary border-tertiary">
        <h3 className="text-xl font-semibold">Criar / Editar Evento</h3>
        <form
            className="grid grid-cols-1 gap-3 lg:grid-cols-2"
            onSubmit={onSubmit}
        >
            <BaseInput
                label="Título"
                placeholder="Título do evento"
                type="text"
                value={draftEvent.title}
                onChange={event =>
                    updateDraftField('title', event.target.value)
                }
                name="title"
            />
            <BaseSelect
                label="Tipo"
                options={EVENT_TYPE_OPTIONS}
                value={draftEvent.type}
                onChange={event =>
                    updateDraftField('type', event.target.value as EventType)
                }
                name="type"
            />
            <BaseInput
                label="Data de início"
                placeholder=""
                type="datetime-local"
                value={draftEvent.startDate}
                onChange={event =>
                    updateDraftField('startDate', event.target.value)
                }
                name="startDate"
            />
            <BaseInput
                label="Data de término"
                placeholder=""
                type="datetime-local"
                value={draftEvent.endDate}
                onChange={event =>
                    updateDraftField('endDate', event.target.value)
                }
                name="endDate"
            />
            <BaseInput
                label="Local"
                placeholder="Local físico ou link online"
                type="text"
                value={draftEvent.location}
                onChange={event =>
                    updateDraftField('location', event.target.value)
                }
                name="location"
            />
            <BaseInput
                label="Imagem de capa"
                placeholder="URL da imagem de capa"
                type="url"
                value={draftEvent.image}
                onChange={event =>
                    updateDraftField('image', event.target.value)
                }
                name="image"
            />
            <div className="lg:col-span-2">
                <BaseTextArea
                    label="Descrição"
                    placeholder="Descrição do evento"
                    value={draftEvent.description}
                    onChange={event =>
                        updateDraftField('description', event.target.value)
                    }
                    name="description"
                    rows={4}
                />
            </div>
            <BaseInput
                label="Preço/ingresso"
                placeholder="Preço/ingresso"
                type="text"
                value={draftEvent.ticketPrice}
                onChange={event =>
                    updateDraftField('ticketPrice', event.target.value)
                }
                name="ticketPrice"
            />
            <BaseInput
                label="Site oficial"
                placeholder="Site oficial"
                type="url"
                value={draftEvent.website}
                onChange={event =>
                    updateDraftField('website', event.target.value)
                }
                name="website"
            />
            <BaseInput
                label="Instagram / Twitter"
                placeholder="Instagram / Twitter"
                type="text"
                value={draftEvent.instagram}
                onChange={event =>
                    updateDraftField('instagram', event.target.value)
                }
                name="instagram"
            />
            <BaseInput
                label="Contato"
                placeholder="Contato do organizador"
                type="text"
                value={draftEvent.contact}
                onChange={event =>
                    updateDraftField('contact', event.target.value)
                }
                name="contact"
            />
            <BaseInput
                label="Máximo de participantes"
                placeholder="Máximo de participantes"
                type="text"
                value={draftEvent.maxParticipants}
                onChange={event =>
                    updateDraftField('maxParticipants', event.target.value)
                }
                name="maxParticipants"
            />
            <BaseSelect
                label="Privacidade"
                options={PRIVACY_OPTIONS}
                value={draftEvent.privacy}
                onChange={event =>
                    updateDraftField('privacy', event.target.value)
                }
                name="privacy"
            />
            <div className="lg:col-span-2">
                <BaseCheckbox
                    label="Exigir aprovação para participar"
                    checked={draftEvent.approvalRequired}
                    onChange={checked =>
                        updateDraftField('approvalRequired', checked)
                    }
                    name="approvalRequired"
                />
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-purple-600 rounded-lg"
                >
                    Publicar evento
                </button>
                <button
                    type="button"
                    onClick={toggleDraft}
                    className="px-4 py-2 border rounded-lg border-tertiary"
                >
                    {draftEvent.asDraft
                        ? 'Rascunho salvo'
                        : 'Salvar como rascunho'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border rounded-lg border-tertiary"
                >
                    Cancelar
                </button>
            </div>
        </form>
        <div className="p-4 text-sm border rounded-lg border-tertiary bg-primary">
            <p className="mb-2 font-semibold">Preview em tempo real</p>
            <p className="font-medium">
                {draftEvent.title || 'Título do evento'}
            </p>
            <p>{draftEvent.description || 'Descrição aparecerá aqui.'}</p>
            <p className="mt-1 text-tertiary">
                {draftEvent.startDate
                    ? `Início: ${new Date(draftEvent.startDate).toLocaleString('pt-BR')}`
                    : 'Defina data e hora'}
            </p>
        </div>
    </section>
);

export default CreateEventForm;
