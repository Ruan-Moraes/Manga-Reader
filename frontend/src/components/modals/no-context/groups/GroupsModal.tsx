import BaseModal from '../../base/BaseModal';
import GroupsContainer from '../../../cards/groups/GroupsContainer';

import { GroupTypes } from '../../../../types/GroupTypes';
import {
    getGroupsByTitle,
    mockGroups,
} from '../../../../services/mock/mockGroupService';

type GroupsModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    groups?: GroupTypes[];
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
    const scopedGroups =
        groups ?? (titleId ? getGroupsByTitle(String(titleId)) : mockGroups);

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
