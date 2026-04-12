import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminTitleDetail } from '@feature/admin/service/adminTitleService';
import useAdminTitleActions from '@feature/admin/hook/useAdminTitleActions';
import type { CreateTitleRequest } from '@feature/admin/type/admin.types';

const DashboardTitleForm = () => {
    const { titleId } = useParams<{ titleId: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(titleId);

    const { handleCreate, handleUpdate, handleDelete, isSubmitting } =
        useAdminTitleActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TITLE_DETAIL, titleId],
        queryFn: () => getAdminTitleDetail(titleId!),
        enabled: isEditing,
    });

    const [form, setForm] = useState<CreateTitleRequest>({
        name: '',
        type: 'manga',
        cover: '',
        synopsis: '',
        genres: [],
        status: '',
        author: '',
        artist: '',
        publisher: '',
        adult: false,
    });

    const [genresInput, setGenresInput] = useState('');

    useEffect(() => {
        if (existing) {
            setForm({
                name: existing.name,
                type: existing.type,
                cover: existing.cover ?? '',
                synopsis: existing.synopsis ?? '',
                genres: existing.genres,
                status: existing.status ?? '',
                author: existing.author ?? '',
                artist: existing.artist ?? '',
                publisher: existing.publisher ?? '',
                adult: existing.adult,
            });
            setGenresInput(existing.genres.join(', '));
        }
    }, [existing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...form,
            genres: genresInput
                .split(',')
                .map(g => g.trim())
                .filter(Boolean),
        };

        if (isEditing && titleId) {
            const result = await handleUpdate(titleId, data);
            if (result) navigate('/Manga-Reader/dashboard/titles');
        } else {
            const result = await handleCreate(data);
            if (result) navigate('/Manga-Reader/dashboard/titles');
        }
    };

    const handleDeleteClick = async () => {
        if (!titleId || !confirm('Tem certeza que deseja excluir este titulo?'))
            return;
        await handleDelete(titleId);
        navigate('/Manga-Reader/dashboard/titles');
    };

    if (isEditing && isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="w-32 h-8 rounded-xs bg-tertiary/30 animate-pulse" />
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate('/Manga-Reader/dashboard/titles')}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                Voltar para lista
            </button>

            <h1 className="text-lg font-bold">
                {isEditing ? 'Editar Titulo' : 'Novo Titulo'}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Nome *</span>
                        <input
                            required
                            value={form.name}
                            onChange={e =>
                                setForm(f => ({ ...f, name: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Tipo *</span>
                        <select
                            value={form.type}
                            onChange={e =>
                                setForm(f => ({ ...f, type: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        >
                            <option value="manga">Manga</option>
                            <option value="manhwa">Manhwa</option>
                            <option value="manhua">Manhua</option>
                        </select>
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">Sinopse</span>
                    <textarea
                        rows={3}
                        value={form.synopsis}
                        onChange={e =>
                            setForm(f => ({ ...f, synopsis: e.target.value }))
                        }
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Cover URL</span>
                        <input
                            value={form.cover}
                            onChange={e =>
                                setForm(f => ({ ...f, cover: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Status</span>
                        <input
                            value={form.status}
                            onChange={e =>
                                setForm(f => ({ ...f, status: e.target.value }))
                            }
                            placeholder="ONGOING, COMPLETED, HIATUS..."
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        Generos (separados por virgula)
                    </span>
                    <input
                        value={genresInput}
                        onChange={e => setGenresInput(e.target.value)}
                        placeholder="Action, Adventure, Fantasy"
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Autor</span>
                        <input
                            value={form.author}
                            onChange={e =>
                                setForm(f => ({ ...f, author: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Artista</span>
                        <input
                            value={form.artist}
                            onChange={e =>
                                setForm(f => ({ ...f, artist: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-tertiary">Editora</span>
                        <input
                            value={form.publisher}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    publisher: e.target.value,
                                }))
                            }
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </label>
                </div>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={form.adult}
                        onChange={e =>
                            setForm(f => ({ ...f, adult: e.target.checked }))
                        }
                    />
                    <span className="text-sm">Conteudo adulto</span>
                </label>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Salvando...'
                            : isEditing
                              ? 'Salvar'
                              : 'Criar'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-semibold text-red-300 border rounded-xs border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                        >
                            Excluir
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default DashboardTitleForm;
