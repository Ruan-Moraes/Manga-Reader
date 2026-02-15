import { useEffect, useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';
import GroupsContainer from '../card/GroupsContainer';

import { Group } from '../../type/group.types';
import {
    getGroupsByTitleId,
} from '../../service/groupService';

type GroupsModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    groups?: Group[];
    isLoading?: boolean;
    titleId?: number;
};

const GroupsModal = ({
    isModalOpen,
    closeModal,
    groups,
    isLoading = false,
    titleId,
}: GroupsModalProps) => {
    const [scopedGroups, setScopedGroups] = useState<Group[]>(
        groups ?? [],
    );

    useEffect(() => {
        if (groups) {
            setScopedGroups(groups);
            return;
        }

        if (titleId) {
            getGroupsByTitleId(String(titleId)).then(setScopedGroups);
        }
    }, [groups, titleId]);

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between p-4 border-b border-tertiary">
                    <h2 className="text-lg font-bold">Grupos de Tradução</h2>
                    <button onClick={closeModal}>Fechar</button>
                </div>

                <div className="p-4 max-h-80 overflow-y-auto">
                    <GroupsContainer
                        groups={scopedGroups}
                        isLoading={isLoading}
                        title=""
                    />
                </div>
            </div>
        </BaseModal>
    );
};

export default GroupsModal;
