import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import TextSection from '@shared/component/paragraph/TextSection';
import ImageLightbox from '@shared/component/modal/image/ImageLightbox';
import SocialMediaLink from '@shared/component/social-media/SocialMediaLink';
import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';
import formatDate from '@shared/service/util/formatDate';

import { getMockUserById } from '@mock/data/users';
import { useAuth } from '@feature/auth';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const UserDetails = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();

    const [isPhotoExpanded, setIsPhotoExpanded] = useState<boolean>(false);

    const user = useMemo(() => {
        if (!userId) return null;

        return getMockUserById(userId);
    }, [userId]);

    const targetUser = user ?? currentUser;

    if (!targetUser) {
        return (
            <>
                <Header showSearch={true} />
                <MainContent>
                    <TextSection>
                        <SectionTitle
                            titleStyleClasses="text-lg"
                            title="Usuário não encontrado"
                        />
                        <p className="text-sm text-tertiary">
                            Não foi possível carregar o perfil solicitado.
                        </p>
                    </TextSection>
                </MainContent>
                <Footer showLinks={true} />
            </>
        );
    }

    const dateOptions = {
        year: 'numeric' as const,
        month: 'long' as const,
    };

    const roleLabel =
        targetUser.role === 'admin'
            ? 'Administrador'
            : targetUser.role === 'poster'
              ? 'Postador'
              : 'Leitor';

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title={`Perfil de ${targetUser.name}`}
                    />

                    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setIsPhotoExpanded(true)}
                                className="overflow-hidden border rounded-xs border-tertiary"
                            >
                                <img
                                    src={targetUser.photo}
                                    alt={`Foto de perfil de ${targetUser.name}`}
                                    className="object-cover w-full h-full min-h-56"
                                />
                            </button>

                            <div className="p-3 border rounded-xs border-tertiary bg-secondary/40">
                                <h4 className="mb-2 text-sm font-semibold">
                                    Conta
                                </h4>
                                <ul className="space-y-1 text-xs text-tertiary">
                                    <li>
                                        <span className="font-semibold text-primary-default">
                                            Cargo:
                                        </span>{' '}
                                        {roleLabel}
                                    </li>
                                    {targetUser.member?.isMember && (
                                        <li>
                                            <span className="font-semibold text-primary-default">
                                                Membro desde:
                                            </span>{' '}
                                            {formatDate(
                                                targetUser.member.since,
                                                dateOptions,
                                            )}
                                        </li>
                                    )}
                                    {targetUser.moderator?.isModerator && (
                                        <li>
                                            <span className="font-semibold text-primary-default">
                                                Moderação desde:
                                            </span>{' '}
                                            {formatDate(
                                                targetUser.moderator.since,
                                                dateOptions,
                                            )}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-bold">
                                    {targetUser.name}
                                </h3>
                                {targetUser.bio && (
                                    <p className="mt-1 text-sm text-tertiary">
                                        {targetUser.bio}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2 text-xs sm:grid-cols-3">
                                <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                    {targetUser.statistics?.comments ?? 0}{' '}
                                    comentários
                                </div>
                                <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                    {targetUser.statistics?.likes ?? 0} likes
                                </div>
                                <div className="p-2 border rounded-xs border-tertiary bg-secondary/40">
                                    {targetUser.statistics?.dislikes ?? 0}{' '}
                                    dislikes
                                </div>
                            </div>

                            {targetUser.socialMediasLinks &&
                                targetUser.socialMediasLinks.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold">
                                            Redes sociais
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {targetUser.socialMediasLinks.map(
                                                socialMedia => (
                                                    <SocialMediaLink
                                                        key={socialMedia.link}
                                                        link={socialMedia.link}
                                                        name={socialMedia.name}
                                                        color={
                                                            SOCIAL_MEDIA_COLORS[
                                                                socialMedia.name as SocialMediaName
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {targetUser.recommendedTitles &&
                                targetUser.recommendedTitles.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold">
                                            Obras recomendadas
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {targetUser.recommendedTitles.map(
                                                title => (
                                                    <Link
                                                        key={title.link}
                                                        to={`/Manga-Reader${title.link}`}
                                                        className="overflow-hidden border rounded-xs border-tertiary"
                                                    >
                                                        <img
                                                            src={title.image}
                                                            alt="Obra recomendada"
                                                            className="object-cover w-full h-36"
                                                        />
                                                    </Link>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </TextSection>
            </MainContent>

            <ImageLightbox
                isOpen={isPhotoExpanded}
                onClose={() => setIsPhotoExpanded(false)}
                src={targetUser.photo}
                alt={`Foto de perfil de ${targetUser.name}`}
            />

            <Footer showLinks={true} />
        </>
    );
};

export default UserDetails;
