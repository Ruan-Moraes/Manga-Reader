import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { Avatar } from '@ui/Avatar';
import { SearchField } from '@ui/SearchField';
import { GroupMember, Group } from '../../model/group.types';
import GroupMemberModal from './GroupMemberModal';

type MemberListModalProps = {
    isOpen: boolean;
    closeModal: () => void;
    group: Group;
};

const MemberListModal = ({ isOpen, closeModal, group }: MemberListModalProps) => {
    const { t } = useTranslation('group');
    const [search, setSearch] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<GroupMember | null>(null);

    const filteredMembers = useMemo(() => group.members.filter(member => member.name.toLowerCase().includes(search.toLowerCase())), [group.members, search]);

    return (
        <>
            <Modal
                open={isOpen}
                onClose={closeModal}
                title={t('member.membersHeader', {
                    name: group.name,
                    count: group.members.length,
                })}
            >
                <section className="mx-auto w-full max-w-3xl">
                    <SearchField value={search} onChange={setSearch} placeholder={t('member.searchPlaceholder')} className="mb-3" />

                    <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto sm:grid-cols-2">
                        {filteredMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedUser(member)}
                                className="flex gap-3 items-center p-2 text-left border rounded-xs border-tertiary hover:border-mr-accent-border hover:shadow-default transition-all"
                            >
                                <Avatar src={member.avatar} name={member.name} size={40} />
                                <div>
                                    <p className="text-sm font-bold">{member.name}</p>
                                    <p className="text-xs text-tertiary">{member.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </Modal>

            <GroupMemberModal isOpen={Boolean(selectedUser)} user={selectedUser} closeModal={() => setSelectedUser(null)} />
        </>
    );
};

export default MemberListModal;
