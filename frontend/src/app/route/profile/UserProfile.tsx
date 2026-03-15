import { useState } from 'react';
import { useParams } from 'react-router-dom';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import ImageLightbox from '@shared/component/modal/image/ImageLightbox';
import SocialMediaLink from '@shared/component/social-media/SocialMediaLink';
import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import { useAuth } from '@feature/auth';
import { type User } from '@feature/user';
import useEnrichedProfile from '@feature/user/hook/useEnrichedProfile';
import { updateProfile } from '@feature/user/service/userService';

import ProfileBanner from '@feature/user/component/profile/ProfileBanner';
import ProfileHeader from '@feature/user/component/profile/ProfileHeader';
import ProfileStats from '@feature/user/component/profile/ProfileStats';
import ProfileTabs from '@feature/user/component/profile/ProfileTabs';
import RecommendationsSection from '@feature/user/component/profile/RecommendationsSection';
import CommentsSection from '@feature/user/component/profile/CommentsSection';
import ViewHistorySection from '@feature/user/component/profile/ViewHistorySection';
import PrivacySettingsForm from '@feature/user/component/profile/PrivacySettingsForm';
import ProfileEditModal from '@feature/user/component/profile/ProfileEditModal';
import ProfileSkeleton from '@feature/user/component/profile/ProfileSkeleton';
import ProfileEmptyState from '@feature/user/component/profile/ProfileEmptyState';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const UserProfile = () => {
    const { userId } = useParams();
    const { user: authUser } = useAuth();

    // If no userId param and user is authenticated, fetch own profile
    // If no userId and not authenticated, show login prompt
    const targetUserId = userId ?? undefined;

    const { profile, loading, error, refetch } = useEnrichedProfile(
        targetUserId ?? (authUser ? undefined : '__none__'),
    );

    const [activeTab, setActiveTab] = useState('about');
    const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleSaveProfile = async (data: {
        name: string;
        bio: string;
        photoUrl: string;
        bannerUrl: string;
        socialLinks: { platform: string; url: string }[];
    }) => {
        await updateProfile({
            name: data.name,
            bio: data.bio,
            photoUrl: data.photoUrl,
            bannerUrl: data.bannerUrl,
            socialLinks: data.socialLinks,
        } as unknown as Partial<User>);
        refetch();
    };

    if (!authUser && !userId) {
        return (
            <>
                <Header />
                <MainContent>
                    <ProfileEmptyState message="Faca login para visualizar seu perfil." />
                </MainContent>
                <Footer />
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header />
                <MainContent>
                    <ProfileSkeleton />
                </MainContent>
                <Footer />
            </>
        );
    }

    if (error || !profile) {
        return (
            <>
                <Header />
                <MainContent>
                    <ProfileEmptyState message={error ?? 'Perfil nao encontrado.'} />
                </MainContent>
                <Footer />
            </>
        );
    }

    const hasComments = profile.recentComments !== null;
    const hasHistory = profile.recentViewHistory !== null;

    return (
        <>
            <Header />
            <MainContent className="!p-0 !gap-0">
                <div className="border rounded-xs border-tertiary bg-secondary/30 overflow-hidden">
                    <ProfileBanner
                        bannerUrl={profile.bannerUrl}
                        photoUrl={profile.photoUrl}
                        name={profile.name}
                        onPhotoClick={() => setIsPhotoExpanded(true)}
                    />

                    <ProfileHeader
                        name={profile.name}
                        role={profile.role}
                        bio={profile.bio}
                        createdAt={profile.createdAt}
                        isOwner={profile.isOwner}
                        onEdit={() => setIsEditOpen(true)}
                    />

                    <ProfileStats stats={profile.stats} />

                    <div className="mt-4">
                        <ProfileTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            isOwner={profile.isOwner}
                            hasComments={hasComments}
                            hasHistory={hasHistory}
                        />

                        <div className="py-2">
                            {activeTab === 'about' && (
                                <div className="px-4 py-3 space-y-4">
                                    {profile.bio && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2">Bio</h3>
                                            <p className="text-sm text-tertiary">{profile.bio}</p>
                                        </div>
                                    )}

                                    {profile.socialLinks.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2">Redes Sociais</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.socialLinks.map(sl => (
                                                    <SocialMediaLink
                                                        key={sl.id}
                                                        link={sl.url}
                                                        name={sl.platform}
                                                        color={
                                                            SOCIAL_MEDIA_COLORS[
                                                                sl.platform.toLowerCase() as SocialMediaName
                                                            ] ?? '#666'
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile.isOwner && profile.email && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">Email</h3>
                                            <p className="text-sm text-tertiary">{profile.email}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'recommendations' && (
                                <RecommendationsSection
                                    recommendations={profile.recommendations}
                                    isOwner={profile.isOwner}
                                    onUpdate={refetch}
                                />
                            )}

                            {activeTab === 'comments' && (
                                <CommentsSection
                                    userId={profile.id}
                                    isOwner={profile.isOwner}
                                    commentVisibility={
                                        profile.privacySettings?.commentVisibility ?? 'PUBLIC'
                                    }
                                />
                            )}

                            {activeTab === 'history' && (
                                <ViewHistorySection
                                    userId={profile.id}
                                    isOwner={profile.isOwner}
                                    viewHistoryVisibility={
                                        profile.privacySettings?.viewHistoryVisibility ?? 'PUBLIC'
                                    }
                                />
                            )}

                            {activeTab === 'settings' && profile.privacySettings && (
                                <PrivacySettingsForm
                                    privacySettings={profile.privacySettings}
                                    onUpdate={refetch}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </MainContent>

            <ImageLightbox
                isOpen={isPhotoExpanded}
                onClose={() => setIsPhotoExpanded(false)}
                src={profile.photoUrl ?? ''}
                alt={`Foto de perfil de ${profile.name}`}
            />

            {profile.isOwner && (
                <ProfileEditModal
                    profile={profile}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSave={handleSaveProfile}
                />
            )}

            <Footer />
        </>
    );
};

export default UserProfile;
