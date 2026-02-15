import { useMemo, useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';

import BaseModal from '@shared/component/modal/base/BaseModal';
import { GroupMember, Group } from '../../type/group.types';
import UserModal from './UserModal';

type MemberModalProps = {
    isOpen: boolean;
    closeModal: () => void;
    group: Group;
};

const MemberModal = ({ isOpen, closeModal, group }: MemberModalProps) => {
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

                    <input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Buscar membro"
                        className="px-3 py-2 mt-3 w-full text-sm rounded-xs border border-tertiary bg-primary"
                    />

                    <div className="grid grid-cols-1 gap-2 mt-3 max-h-80 overflow-y-auto sm:grid-cols-2">
                        {filteredMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedUser(member)}
                                className="flex gap-3 items-center p-2 text-left border rounded-xs border-tertiary hover:border-quaternary hover:shadow-default transition-all"
                            >
                                <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full"
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

            <UserModal
                isOpen={Boolean(selectedUser)}
                user={selectedUser}
                closeModal={() => setSelectedUser(null)}
            />
        </>
    );
};

export default MemberModal;
