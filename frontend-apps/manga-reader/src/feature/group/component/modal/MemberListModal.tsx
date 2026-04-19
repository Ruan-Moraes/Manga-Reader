import { useMemo, useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';

import BaseModal from '@shared/component/modal/base/BaseModal';
import UserAvatar from '@shared/component/avatar/UserAvatar';
import SearchInput from '@shared/component/input/SearchInput';
import { GroupMember, Group } from '../../type/group.types';
import GroupMemberModal from './GroupMemberModal';

type MemberListModalProps = {
    isOpen: boolean;
    closeModal: () => void;
    group: Group;
};

const MemberListModal = ({
    isOpen,
    closeModal,
    group,
}: MemberListModalProps) => {
    const [search, setSearch] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<GroupMember | null>(null);

    const filteredMembers = useMemo(
        () =>
            group.members.filter(member =>
                member.name.toLowerCase().includes(search.toLowerCase()),
            ),
        [group.members, search],
    );

    return (
        <>
            <BaseModal isModalOpen={isOpen} closeModal={closeModal}>
                <section className="mx-auto w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200">
                    <header className="flex justify-between items-center pb-2 border-b border-tertiary">
                        <h3 className="font-bold">
                            {group.name} • {group.members.length} membros
                        </h3>
                        <button onClick={closeModal}>
                            <IoCloseOutline size={20} />
                        </button>
                    </header>

                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar membro"
                        className="mt-3"
                    />

                    <div className="grid grid-cols-1 gap-2 mt-3 max-h-80 overflow-y-auto sm:grid-cols-2">
                        {filteredMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedUser(member)}
                                className="flex gap-3 items-center p-2 text-left border rounded-xs border-tertiary hover:border-quaternary hover:shadow-default transition-all"
                            >
                                <UserAvatar
                                    src={member.avatar}
                                    name={member.name}
                                    size="md"
                                    rounded="full"
                                />
                                <div>
                                    <p className="text-sm font-bold">
                                        {member.name}
                                    </p>
                                    <p className="text-xs text-tertiary">
                                        {member.role}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </BaseModal>

            <GroupMemberModal
                isOpen={Boolean(selectedUser)}
                user={selectedUser}
                closeModal={() => setSelectedUser(null)}
            />
        </>
    );
};

export default MemberListModal;
