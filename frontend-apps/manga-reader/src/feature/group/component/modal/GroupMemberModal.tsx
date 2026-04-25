import { IoCloseOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

import BaseModal from '@shared/component/modal/base/BaseModal';
import UserAvatar from '@shared/component/avatar/UserAvatar';
import { GroupMember } from '../../type/group.types';
import AppLink from '@shared/component/link/element/AppLink';

type GroupMemberModalProps = {
    isOpen: boolean;
    user: GroupMember | null;
    closeModal: () => void;
};

const GroupMemberModal = ({
    isOpen,
    user,
    closeModal,
}: GroupMemberModalProps) => {
    const { t, i18n } = useTranslation('group');

    if (!user) return null;

    return (
        <BaseModal isModalOpen={isOpen} closeModal={closeModal}>
            <section className="mx-auto w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <header className="flex justify-between items-center pb-2 border-b border-tertiary">
                    <h3 className="font-bold">{t('member.profileTitle')}</h3>
                    <button onClick={closeModal}>
                        <IoCloseOutline size={20} />
                    </button>
                </header>

                <div className="flex gap-3 items-center mt-3">
                    <UserAvatar
                        src={user.avatar}
                        name={user.name}
                        size="xl"
                        rounded="full"
                        className="border border-quaternary"
                    />
                    <div>
                        <h4 className="text-lg font-bold">{user.name}</h4>
                        <p className="text-xs text-tertiary">{user.role}</p>
                    </div>
                </div>

                <p className="mt-3 text-sm text-tertiary">{user.bio}</p>
                <p className="mt-1 text-xs text-tertiary">
                    {t('member.joinedAt', {
                        date: new Date(user.joinedAt).toLocaleDateString(
                            i18n.language,
                        ),
                    })}
                </p>

                <div className="mt-4">
                    <h5 className="text-sm font-bold">
                        {t('member.participatesIn')}
                    </h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {user.groups.map(group => (
                            <AppLink
                                key={group.id}
                                link={`groups/${group.id}`}
                                text={group.name}
                                className="px-2 py-1 text-xs border rounded-xs border-tertiary"
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    <h5 className="text-sm font-bold">
                        {t('member.recentActivity')}
                    </h5>
                    <div className="flex flex-col gap-2 mt-2 max-h-56 overflow-y-auto pr-1">
                        {user.recentPosts.slice(0, 5).map(post => (
                            <a
                                key={post.id}
                                href={post.link}
                                className="p-2 border rounded-xs border-tertiary hover:border-quaternary transition-colors"
                            >
                                <p className="text-xs">{post.summary}</p>
                                <p className="text-[0.7rem] text-tertiary mt-1">
                                    {new Date(
                                        post.createdAt,
                                    ).toLocaleDateString(i18n.language)}{' '}
                                    •{' '}
                                    {post.titleName ?? t('member.noTitle')}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </BaseModal>
    );
};

export default GroupMemberModal;
