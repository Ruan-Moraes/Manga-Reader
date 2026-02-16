import { IoCloseOutline } from 'react-icons/io5';

import BaseModal from '@shared/component/modal/base/BaseModal';
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
    if (!user) return null;

    return (
        <BaseModal isModalOpen={isOpen} closeModal={closeModal}>
            <section className="mx-auto w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <header className="flex justify-between items-center pb-2 border-b border-tertiary">
                    <h3 className="font-bold">Perfil de membro</h3>
                    <button onClick={closeModal}>
                        <IoCloseOutline size={20} />
                    </button>
                </header>

                <div className="flex gap-3 items-center mt-3">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full border border-quaternary"
                    />
                    <div>
                        <h4 className="text-lg font-bold">{user.name}</h4>
                        <p className="text-xs text-tertiary">{user.role}</p>
                    </div>
                </div>

                <p className="mt-3 text-sm text-tertiary">{user.bio}</p>
                <p className="mt-1 text-xs text-tertiary">
                    Entrou na plataforma em{' '}
                    {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
                </p>

                <div className="mt-4">
                    <h5 className="text-sm font-bold">Grupos que participa</h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {user.groups.map(group => (
                            <AppLink
                                key={group.id}
                                link={`/groups/${group.id}`}
                                text={group.name}
                                className="px-2 py-1 text-xs border rounded-xs border-tertiary"
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    <h5 className="text-sm font-bold">
                        Últimos posts/comentários
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
                                    ).toLocaleDateString('pt-BR')}{' '}
                                    • {post.titleName ?? 'Sem obra vinculada'}
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
