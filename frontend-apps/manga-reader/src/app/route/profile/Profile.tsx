import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AppLink from '@shared/component/link/element/AppLink';
import { showSuccessToast } from '@shared/service/util/toastService';

import { useAuth } from '@feature/auth';
import { useUserProfile } from '@feature/user';
import { getLibraryCounts } from '@feature/library/service/libraryService';
import type { LibraryCounts } from '@feature/library/type/saved-library.types';

const Profile = () => {
    const { t } = useTranslation('user');
    const { user, setUser } = useAuth();
    const { updateProfile } = useUserProfile(setUser);
    const [name, setName] = useState(user?.name ?? '');
    const [bio, setBio] = useState(user?.bio ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');
    const [bioError, setBioError] = useState('');
    const [counts, setCounts] = useState<LibraryCounts | null>(null);

    const fetchCounts = useCallback(async () => {
        try {
            const data = await getLibraryCounts();
            setCounts(data);
        } catch {
            // non-critical
        }
    }, []);

    useEffect(() => {
        if (user) fetchCounts();
    }, [user, fetchCounts]);

    const validate = () => {
        let valid = true;
        if (!name.trim()) {
            setNameError(t('page.nameEmptyError'));
            valid = false;
        } else {
            setNameError('');
        }
        if (bio.length > 500) {
            setBioError(t('page.bioMaxError', { length: bio.length }));
            valid = false;
        } else {
            setBioError('');
        }
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await updateProfile({ name: name.trim(), bio });
            showSuccessToast(t('page.updateSuccess'));
        } finally {
            setSubmitting(false);
        }
    };

    const statCards = counts
        ? [
              { label: t('page.stats.reading'), value: counts.lendo },
              { label: t('page.stats.wantToRead'), value: counts.queroLer },
              { label: t('page.stats.completed'), value: counts.concluido },
              { label: t('page.stats.total'), value: counts.total },
          ]
        : null;

    return (
        <>
            <Header />
            <MainContent>
                <section className="p-4 border rounded-xs border-tertiary bg-secondary/30">
                    <h2 className="mb-4 text-xl font-bold">
                        {t('page.title')}
                    </h2>
                    {user ? (
                        <div className="grid gap-4 mobile-md:grid-cols-[120px_1fr] items-start">
                            <img
                                src={user.photo}
                                alt={user.name}
                                className="object-cover w-28 h-28 border rounded-full border-tertiary"
                            />
                            <form
                                className="flex flex-col gap-3"
                                onSubmit={handleSubmit}
                            >
                                <label className="text-sm">
                                    {t('page.nameLabel')}
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                                    />
                                    {nameError && (
                                        <span className="text-xs text-quinary-default">
                                            {nameError}
                                        </span>
                                    )}
                                </label>
                                <label className="text-sm">
                                    {t('page.bioLabel')}
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        className="w-full h-24 px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                                    />
                                    <span
                                        className={`text-xs ${bio.length > 500 ? 'text-quinary-default' : 'text-tertiary'}`}
                                    >
                                        {bio.length}/500
                                    </span>
                                    {bioError && (
                                        <span className="text-xs text-quinary-default block">
                                            {bioError}
                                        </span>
                                    )}
                                </label>
                                <button
                                    disabled={submitting}
                                    className="px-3 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50"
                                >
                                    {submitting
                                        ? t('page.saving')
                                        : t('page.save')}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">
                            {t('page.loginPrompt')}
                        </p>
                    )}
                </section>

                {statCards && (
                    <section className="flex flex-col gap-3">
                        <h3 className="text-lg font-bold">
                            {t('page.myLibraryTitle')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {statCards.map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center gap-1 p-3 border rounded-xs border-tertiary bg-secondary/30"
                                >
                                    <span className="text-2xl font-bold">
                                        {value}
                                    </span>
                                    <span className="text-xs text-tertiary">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <AppLink
                                link="library"
                                text={t('page.viewLibrary')}
                                className="text-sm text-quaternary hover:underline"
                            />
                            <AppLink
                                link="reviews"
                                text={t('page.viewReviews')}
                                className="text-sm text-quaternary hover:underline"
                            />
                        </div>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default Profile;
