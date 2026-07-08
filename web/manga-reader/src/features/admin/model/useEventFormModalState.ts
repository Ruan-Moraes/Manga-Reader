import { useEffect, useState } from 'react';

import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

import type { AdminEvent, CreateEventRequest, UpdateEventRequest } from '../model/admin.types';

const useEventFormModalState = (event: AdminEvent | null | undefined, isOpen: boolean, onSubmit: (data: CreateEventRequest | UpdateEventRequest) => void) => {
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

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, {
        startDate,
        endDate,
        timeline,
        status,
        type,
        image,
        locationLabel,
        locationCity,
        locationIsOnline,
        organizerName,
        priceLabel,
        isFeatured,
        title,
        subtitle,
        description,
    });

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
        resetDirty();
    }, [event, isOpen, resetDirty]);

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

    return {
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
    };
};

export default useEventFormModalState;
