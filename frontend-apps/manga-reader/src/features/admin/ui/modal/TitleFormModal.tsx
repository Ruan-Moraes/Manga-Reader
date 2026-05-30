import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { Input } from '@ui/Input';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import FormModal from './FormModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type { AdminTitle, CreateTitleRequest, UpdateTitleRequest } from '../../model/admin.types';

type TitleFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTitleRequest | UpdateTitleRequest) => void;
    title?: AdminTitle | null;
    isSubmitting: boolean;
};

const TitleFormModal = ({ isOpen, onClose, onSubmit, title, isSubmitting }: TitleFormModalProps) => {
    const { t } = useTranslation('admin');

    const [type, setType] = useState('manga');
    const [cover, setCover] = useState('');
    const [genres, setGenres] = useState('');
    const [status, setStatus] = useState('');
    const [author, setAuthor] = useState('');
    const [artist, setArtist] = useState('');
    const [publisher, setPublisher] = useState('');
    const [adult, setAdult] = useState(false);
    const [name, setName] = useState<LocalizedString>({});
    const [synopsis, setSynopsis] = useState<LocalizedString>({});

    useEffect(() => {
        if (title) {
            setType(title.type);
            setCover(title.cover ?? '');
            setGenres((title.genres ?? []).join(', '));
            setStatus(title.status ?? '');
            setAuthor(title.author ?? '');
            setArtist(title.artist ?? '');
            setPublisher(title.publisher ?? '');
            setAdult(title.adult);
            setName(title.name ?? {});
            setSynopsis(title.synopsis ?? {});
        } else {
            setType('manga');
            setCover('');
            setGenres('');
            setStatus('');
            setAuthor('');
            setArtist('');
            setPublisher('');
            setAdult(false);
            setName({});
            setSynopsis({});
        }
    }, [title, isOpen]);

    const ptName = (name[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptName) return;

        const payload: CreateTitleRequest = {
            name,
            type,
            adult,
            ...(cover ? { cover } : {}),
            ...(Object.keys(synopsis).length ? { synopsis } : {}),
            ...(genres
                ? {
                      genres: genres
                          .split(',')
                          .map(g => g.trim())
                          .filter(Boolean),
                  }
                : {}),
            ...(status ? { status } : {}),
            ...(author ? { author } : {}),
            ...(artist ? { artist } : {}),
            ...(publisher ? { publisher } : {}),
        };

        onSubmit(payload);
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={title ? t('titleForm.editTitle', 'Editar Título') : t('titleForm.newTitle', 'Novo Título')}
            onSubmit={handleSubmit}
            submitLabel={t('common.save', 'Salvar')}
            submittingLabel={t('common.saving', 'Salvando...')}
            cancelLabel={t('common.cancel', 'Cancelar')}
            isSubmitting={isSubmitting}
            submitDisabled={!ptName}
        >
            <LocalizedTextInput
                label={t('titleForm.name', 'Nome')}
                value={name}
                onChange={setName}
                placeholder={t('titleForm.namePlaceholder', 'Nome do título')}
                maxLength={200}
            />

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.type', 'Tipo')}</span>
                <Input type="text" value={type} onChange={e => setType(e.target.value)} placeholder={t('titleForm.typePlaceholder')} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.cover', 'Capa (URL)')}</span>
                <Input type="text" value={cover} onChange={e => setCover(e.target.value)} />
            </div>

            <LocalizedTextInput
                label={t('titleForm.synopsis', 'Sinopse')}
                value={synopsis}
                onChange={setSynopsis}
                multiline
                rows={5}
                placeholder={t('titleForm.synopsisPlaceholder', 'Sinopse...')}
                requiredLanguages={[]}
            />

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.genres', 'Gêneros (separados por vírgula)')}</span>
                <Input type="text" value={genres} onChange={e => setGenres(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.status', 'Status')}</span>
                <Input type="text" value={status} onChange={e => setStatus(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.author', 'Autor')}</span>
                <Input type="text" value={author} onChange={e => setAuthor(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.artist', 'Artista')}</span>
                <Input type="text" value={artist} onChange={e => setArtist(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('titleForm.publisher', 'Editora')}</span>
                <Input type="text" value={publisher} onChange={e => setPublisher(e.target.value)} />
            </div>

            <Checkbox label={t('titleForm.adult', 'Conteúdo adulto')} checked={adult} onChange={e => setAdult(e.target.checked)} />
        </FormModal>
    );
};

export default TitleFormModal;
