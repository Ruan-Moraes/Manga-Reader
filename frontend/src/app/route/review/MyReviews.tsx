import { useCallback, useEffect, useState } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { showSuccessToast } from '@shared/service/util/toastService';

import {
    RatingStars,
    getUserReviews,
    updateReview,
    deleteReview,
    type MangaRating,
} from '@feature/rating';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const MyReviews = () => {
    const [reviews, setReviews] = useState<MangaRating[]>([]);

    const loadReviews = useCallback(async () => {
        const page = await getUserReviews();
        setReviews(page.content);
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

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
                <section className="flex flex-col gap-3">
                    {reviews.map(review => (
                        <article
                            key={review.id}
                            className="p-3 border rounded-xs border-tertiary"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-tertiary">
                                    Obra #{review.titleId}
                                </span>
                                <RatingStars
                                    value={review.stars}
                                    onChange={async value => {
                                        await updateReview({
                                            id: review.id,
                                            titleId: review.titleId,
                                            stars: value,
                                            comment: review.comment,
                                        });
                                        await loadReviews();
                                        showSuccessToast('Nota atualizada.');
                                    }}
                                />
                            </div>
                            <textarea
                                value={review.comment ?? ''}
                                onChange={async event => {
                                    await updateReview({
                                        id: review.id,
                                        titleId: review.titleId,
                                        stars: review.stars,
                                        comment: event.target.value,
                                    });
                                    await loadReviews();
                                }}
                                className="w-full h-20 p-2 mt-2 text-sm border rounded-xs border-tertiary bg-secondary"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={async () => {
                                        await deleteReview(review.id);
                                        await loadReviews();
                                        showSuccessToast('Avaliação removida.');
                                    }}
                                    className="px-3 py-1 text-xs border rounded-xs border-quinary-default hover:bg-quinary-default/20"
                                >
                                    Excluir
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default MyReviews;
