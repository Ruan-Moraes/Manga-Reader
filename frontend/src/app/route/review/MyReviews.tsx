import { useCallback, useEffect, useState } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AppLink from '@shared/component/link/element/AppLink';
import { showSuccessToast, showErrorToast } from '@shared/service/util/toastService';

import {
    RatingStars,
    getUserReviews,
    updateReview,
    deleteReview,
    type MangaRating,
} from '@feature/rating';

const ReviewCard = ({
    review,
    onUpdate,
    onDelete,
}: {
    review: MangaRating;
    onUpdate: (id: string, comment: string) => Promise<void>;
    onDelete: (id: string) => void;
}) => {
    const [comment, setComment] = useState(review.comment ?? '');
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const isDirty = comment !== (review.comment ?? '');

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(review.id, comment);
            showSuccessToast('Comentário atualizado.');
        } catch {
            showErrorToast('Erro ao salvar comentário.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <article className="p-3 border rounded-xs border-tertiary">
            <div className="flex items-center justify-between gap-2">
                <AppLink
                    link={`/title/${review.titleId}`}
                    text={review.titleName ?? `Obra #${review.titleId}`}
                    className="text-sm font-medium"
                />
                <RatingStars value={review.overallRating} />
            </div>
            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full h-20 p-2 mt-2 text-sm border rounded-xs border-tertiary bg-secondary"
            />
            <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-3 py-1 text-xs border rounded-xs border-quaternary text-quaternary hover:bg-quaternary/20 disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    )}
                </div>
                {confirming ? (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-quinary-default">Tem certeza?</span>
                        <button
                            onClick={() => { onDelete(review.id); setConfirming(false); }}
                            className="px-2 py-0.5 border rounded-xs border-quinary-default text-quinary-default hover:bg-quinary-default/20"
                        >
                            Confirmar
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="px-2 py-0.5 border rounded-xs border-tertiary hover:bg-tertiary/20"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-3 py-1 text-xs border rounded-xs border-quinary-default hover:bg-quinary-default/20 text-quinary-default"
                    >
                        Excluir
                    </button>
                )}
            </div>
        </article>
    );
};

const MyReviews = () => {
    const [reviews, setReviews] = useState<MangaRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const loadReviews = useCallback(async (page = 0, append = false) => {
        try {
            if (!append) setLoading(true);
            const result = await getUserReviews(page);
            setReviews(prev => append ? [...prev, ...result.content] : result.content);
            setCurrentPage(page);
            setHasMore(!result.last);
        } catch {
            if (!append) setReviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleUpdate = async (id: string, comment: string) => {
        await updateReview({ id, comment });
        setReviews(prev => prev.map(r => r.id === id ? { ...r, comment } : r));
    };

    const handleDelete = async (id: string) => {
        const prev = reviews;
        setReviews(reviews.filter(r => r.id !== id));
        try {
            await deleteReview(id);
            showSuccessToast('Avaliação removida.');
        } catch {
            setReviews(prev);
            showErrorToast('Erro ao remover avaliação.');
        }
    };

    return (
        <>
            <Header />
            <MainContent>
                <section>
                    <h2 className="text-xl font-bold">Minhas Avaliações</h2>
                    <p className="text-sm text-tertiary">
                        Edite ou remova seus reviews a qualquer momento.
                    </p>
                </section>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 border rounded-xs border-tertiary animate-pulse bg-tertiary/10" />
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <span className="text-4xl">&#9997;</span>
                        <p className="text-sm text-tertiary">
                            Nenhuma avaliação ainda. Avalie seus títulos favoritos!
                        </p>
                    </div>
                ) : (
                    <>
                        <section className="flex flex-col gap-3">
                            {reviews.map(review => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </section>
                        {hasMore && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => loadReviews(currentPage + 1, true)}
                                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                >
                                    Carregar mais
                                </button>
                            </div>
                        )}
                    </>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default MyReviews;
