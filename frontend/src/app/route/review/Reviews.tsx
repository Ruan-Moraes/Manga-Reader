import { useEffect, useState } from 'react';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import {
    RatingStars,
    getUserReviews,
    updateUserReview,
    deleteUserReview,
    type MangaRating,
} from '@feature/rating';
import { showSuccessToast } from '@shared/service/util/toastUtils';

const Reviews = () => {
    const [reviews, setReviews] = useState<MangaRating[]>([]);

    useEffect(() => {
        setReviews(getUserReviews());
    }, []);

    return (
        <>
            <Header />
            <Main>
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
                                    onChange={value => {
                                        updateUserReview({
                                            id: review.id,
                                            stars: value,
                                            comment: review.comment,
                                        });
                                        setReviews(getUserReviews());
                                        showSuccessToast('Nota atualizada.');
                                    }}
                                />
                            </div>
                            <textarea
                                value={review.comment ?? ''}
                                onChange={event => {
                                    updateUserReview({
                                        id: review.id,
                                        stars: review.stars,
                                        comment: event.target.value,
                                    });
                                    setReviews(getUserReviews());
                                }}
                                className="w-full h-20 p-2 mt-2 text-sm border rounded-xs border-tertiary bg-secondary"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => {
                                        deleteUserReview(review.id);
                                        setReviews(getUserReviews());
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
            </Main>
            <Footer />
        </>
    );
};

export default Reviews;
