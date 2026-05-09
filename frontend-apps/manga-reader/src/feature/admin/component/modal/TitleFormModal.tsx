import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import BaseInput from '@shared/component/input/BaseInput';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

import type {
    AdminTitle,
    CreateTitleRequest,
    UpdateTitleRequest,
} from '../../type/admin.types';

type TitleFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTitleRequest | UpdateTitleRequest) => void;
    title?: AdminTitle | null;
    isSubmitting: boolean;
};

const TitleFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    isSubmitting,
}: TitleFormModalProps) => {
    const { t } = useTranslation('admin');

    const [type, setType] = useState('manga');
    const [cover, setCover] = useState('');
    const [genres, setGenres] = useState('');
    const [status, setStatus] = useState('');
    const [author, setAuthor] = useState('');
    const [artist, setArtist] = useState('');
    const [publisher, setPublisher] = useState('');
    const [adult, setAdult] = useState(false);
    const [nameI18n, setNameI18n] = useState<LocalizedString>({});
    const [synopsisI18n, setSynopsisI18n] = useState<LocalizedString>({});

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
            setNameI18n(title.nameI18n ?? { [DEFAULT_LANGUAGE]: title.name });
            setSynopsisI18n(
                title.synopsisI18n ??
                    (title.synopsis ? { [DEFAULT_LANGUAGE]: title.synopsis } : {}),
            );
        } else {
            setType('manga');
            setCover('');
            setGenres('');
            setStatus('');
            setAuthor('');
            setArtist('');
            setPublisher('');
            setAdult(false);
            setNameI18n({});
            setSynopsisI18n({});
        }
    }, [title, isOpen]);

    const ptName = (nameI18n[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptName) return;

        const payload: CreateTitleRequest = {
            name: ptName,
            type,
            nameI18n,
            synopsisI18n,
            adult,
            ...(cover ? { cover } : {}),
            ...(synopsisI18n[DEFAULT_LANGUAGE]
                ? { synopsis: synopsisI18n[DEFAULT_LANGUAGE] }
                : {}),
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
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {title
                        ? t('titleForm.editTitle', 'Editar Título')
                        : t('titleForm.newTitle', 'Novo Título')}
                </h3>

                <LocalizedTextInput
                    label={t('titleForm.name', 'Nome')}
                    value={nameI18n}
                    onChange={setNameI18n}
                    placeholder={t('titleForm.namePlaceholder', 'Nome do título')}
                    maxLength={200}
                />

                <BaseInput
                    label={t('titleForm.type', 'Tipo')}
                    variant="outlined"
                    type="text"
                    value={type}
                    onChange={e => setType(e.target.value)}
                    placeholder={t('titleForm.typePlaceholder')}
                />

                <BaseInput
                    label={t('titleForm.cover', 'Capa (URL)')}
                    variant="outlined"
                    type="text"
                    value={cover}
                    onChange={e => setCover(e.target.value)}
                />

                <LocalizedTextInput
                    label={t('titleForm.synopsis', 'Sinopse')}
                    value={synopsisI18n}
                    onChange={setSynopsisI18n}
                    multiline
                    rows={5}
                    placeholder={t('titleForm.synopsisPlaceholder', 'Sinopse...')}
                    requiredLanguages={[]}
                />

                <BaseInput
                    label={t('titleForm.genres', 'Gêneros (separados por vírgula)')}
                    variant="outlined"
                    type="text"
                    value={genres}
                    onChange={e => setGenres(e.target.value)}
                />

                <BaseInput
                    label={t('titleForm.status', 'Status')}
                    variant="outlined"
                    type="text"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                />

                <BaseInput
                    label={t('titleForm.author', 'Autor')}
                    variant="outlined"
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                />

                <BaseInput
                    label={t('titleForm.artist', 'Artista')}
                    variant="outlined"
                    type="text"
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                />

                <BaseInput
                    label={t('titleForm.publisher', 'Editora')}
                    variant="outlined"
                    type="text"
                    value={publisher}
                    onChange={e => setPublisher(e.target.value)}
                />

                <BaseCheckbox
                    label={t('titleForm.adult', 'Conteúdo adulto')}
                    checked={adult}
                    onChange={setAdult}
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
                        disabled={isSubmitting || !ptName}
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

export default TitleFormModal;
