import { FormEvent, useCallback, useState } from 'react';

import type { EventType } from '../type/event.types';

type DraftEvent = {
    title: string;
    type: EventType;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    image: string;
    ticketPrice: string;
    website: string;
    instagram: string;
    contact: string;
    maxParticipants: string;
    privacy: string;
    approvalRequired: boolean;
    asDraft: boolean;
};

const initialDraft: DraftEvent = {
    title: '',
    type: 'Convenção',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    image: '',
    ticketPrice: '',
    website: '',
    instagram: '',
    contact: '',
    maxParticipants: '',
    privacy: 'public',
    approvalRequired: false,
    asDraft: false,
};

const useEventForm = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [draftEvent, setDraftEvent] = useState<DraftEvent>(initialDraft);

    const openForm = useCallback(() => setShowCreateForm(true), []);
    const closeForm = useCallback(() => setShowCreateForm(false), []);

    const updateDraftField = useCallback(
        <K extends keyof DraftEvent>(field: K, value: DraftEvent[K]) => {
            setDraftEvent(prev => ({ ...prev, [field]: value }));
        },
        [],
    );

    const toggleDraft = useCallback(() => {
        setDraftEvent(prev => ({ ...prev, asDraft: !prev.asDraft }));
    }, []);

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            closeForm();
        },
        [closeForm],
    );

    return {
        showCreateForm,
        openForm,
        closeForm,
        draftEvent,
        updateDraftField,
        toggleDraft,
        handleSubmit,
    };
};

export type { DraftEvent };
export default useEventForm;
