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
            <input
                required
                placeholder="Título do evento"
                value={draftEvent.title}
                onChange={event =>
                    updateDraftField('title', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <select
                value={draftEvent.type}
                onChange={event =>
                    updateDraftField('type', event.target.value as EventType)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            >
                {eventTypes.map(item => (
                    <option key={item}>{item}</option>
                ))}
            </select>
            <input
                required
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={draftEvent.startDate}
                onChange={event =>
                    updateDraftField('startDate', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                required
                type="datetime-local"
                min={
                    draftEvent.startDate ||
                    new Date().toISOString().slice(0, 16)
                }
                value={draftEvent.endDate}
                onChange={event =>
                    updateDraftField('endDate', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                required
                placeholder="Local físico ou link online"
                value={draftEvent.location}
                onChange={event =>
                    updateDraftField('location', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                placeholder="URL da imagem de capa (mock upload + crop)"
                value={draftEvent.image}
                onChange={event =>
                    updateDraftField('image', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <textarea
                required
                placeholder="Descrição do evento (rich text simplificado)"
                value={draftEvent.description}
                onChange={event =>
                    updateDraftField('description', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary lg:col-span-2"
                rows={4}
            />
            <input
                placeholder="Preço/ingresso"
                value={draftEvent.ticketPrice}
                onChange={event =>
                    updateDraftField('ticketPrice', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                placeholder="Site oficial"
                value={draftEvent.website}
                onChange={event =>
                    updateDraftField('website', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                placeholder="Instagram / Twitter"
                value={draftEvent.instagram}
                onChange={event =>
                    updateDraftField('instagram', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                placeholder="Contato do organizador"
                value={draftEvent.contact}
                onChange={event =>
                    updateDraftField('contact', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <input
                placeholder="Máximo de participantes"
                value={draftEvent.maxParticipants}
                onChange={event =>
                    updateDraftField('maxParticipants', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            />
            <select
                value={draftEvent.privacy}
                onChange={event =>
                    updateDraftField('privacy', event.target.value)
                }
                className="p-2 border rounded-lg border-tertiary bg-primary"
            >
                <option value="public">Público</option>
                <option value="members">Restrito a membros</option>
            </select>
            <label className="flex items-center gap-2 text-sm lg:col-span-2">
                <input
                    type="checkbox"
                    checked={draftEvent.approvalRequired}
                    onChange={event =>
                        updateDraftField(
                            'approvalRequired',
                            event.target.checked,
                        )
                    }
                />
                Exigir aprovação para participar
            </label>
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
