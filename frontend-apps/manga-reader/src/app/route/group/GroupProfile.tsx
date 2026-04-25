import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import BaseSelect from '@shared/component/input/BaseSelect';
import AppLink from '@shared/component/link/element/AppLink';
import AlertBanner from '@shared/component/notification/AlertBanner';
import { THEME_COLORS } from '@shared/constant/THEME_COLORS';

import {
    useGroupDetails,
    useGroupWorks,
    GroupDetailHeader,
    MemberListModal,
    type WorkSortOption,
} from '@feature/group';

const GroupProfile = () => {
    const { t, i18n } = useTranslation('group');
    const { groupId } = useParams();

    const [isMemberListModalOpen, setIsMemberListModalOpen] =
        useState<boolean>(false);

    const { group, isLoading } = useGroupDetails(groupId);

    const { workSort, setWorkSort, activeGenre, toggleGenre, sortedWorks } =
        useGroupWorks(group?.translatedWorks ?? []);

    const sortOptions = useMemo(
        () => [
            { value: 'popularity', label: t('profile.sortPopularity') },
            { value: 'date', label: t('profile.sortDate') },
            { value: 'chapters', label: t('profile.sortChapters') },
        ],
        [t],
    );

    if (!isLoading && !group) {
        return (
            <MainContent>
                <AlertBanner
                    color={THEME_COLORS.QUINARY}
                    title={t('profile.notFoundTitle')}
                    message={t('profile.notFoundMessage')}
                    link="/groups"
                    linkText={t('profile.backToGroups')}
                />
            </MainContent>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                {group && (
                    <>
                        <GroupDetailHeader
                            group={group}
                            onOpenMembers={() => setIsMemberListModalOpen(true)}
                        />

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <article className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary bg-secondary/40 lg:col-span-2">
                                <h3 className="font-bold">
                                    {t('profile.aboutTitle')}
                                </h3>
                                <p className="text-sm text-tertiary">
                                    {group.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {group.genres.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-2 py-1 text-xs border rounded-xs transition-colors ${
                                                activeGenre === genre
                                                    ? 'border-quaternary text-quaternary'
                                                    : 'border-tertiary text-tertiary hover:border-quaternary'
                                            }`}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-xs text-tertiary">
                                    {t('profile.foundationInfo', {
                                        year: group.foundedYear,
                                        joinedAt: new Date(
                                            group.platformJoinedAt,
                                        ).toLocaleDateString(i18n.language),
                                    })}
                                </p>
                            </article>
                        </section>

                        <section className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">
                                    {t('profile.translatedWorks')}
                                </h3>
                                <BaseSelect
                                    options={sortOptions}
                                    value={workSort}
                                    onChange={event =>
                                        setWorkSort(
                                            event.target
                                                .value as WorkSortOption,
                                        )
                                    }
                                    className="p-2 text-xs border rounded-xs border-tertiary bg-secondary"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {sortedWorks.map(work => (
                                    <AppLink
                                        key={work.id}
                                        link={`title/${work.id}`}
                                        className="overflow-hidden transition-all border rounded-xs border-tertiary bg-secondary/40 hover:border-quaternary hover:shadow-default"
                                    >
                                        <img
                                            src={work.cover}
                                            alt={work.title}
                                            className="object-cover w-full h-40"
                                        />
                                        <div className="flex flex-col gap-1 p-2">
                                            <h4 className="text-sm font-bold line-clamp-1">
                                                {work.title}
                                            </h4>
                                            <p className="text-xs text-tertiary">
                                                {t('profile.chaptersCount', {
                                                    count: work.chapters,
                                                })}
                                            </p>
                                            <span
                                                className={`w-fit px-2 py-1 text-[0.65rem] border rounded-xs ${
                                                    work.status === 'ongoing'
                                                        ? 'border-green-400 text-green-300'
                                                        : 'border-blue-400 text-blue-300'
                                                }`}
                                            >
                                                {work.status === 'ongoing'
                                                    ? t(
                                                          'profile.statusOngoing',
                                                      )
                                                    : t(
                                                          'profile.statusCompleted',
                                                      )}
                                            </span>
                                        </div>
                                    </AppLink>
                                ))}
                            </div>
                        </section>

                        <MemberListModal
                            isOpen={isMemberListModalOpen}
                            closeModal={() => setIsMemberListModalOpen(false)}
                            group={group}
                        />
                    </>
                )}

                {isLoading && (
                    <section className="p-4 border rounded-xs border-tertiary animate-pulse">
                        <p className="text-tertiary">{t('profile.loading')}</p>
                    </section>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default GroupProfile;
