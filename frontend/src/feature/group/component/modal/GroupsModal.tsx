import { useEffect, useState } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';
import GroupSummaryCard from '../card/GroupSummaryCard';

import { Group } from '../../type/group.types';
import { getGroupsByTitleId } from '../../service/groupService';

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
    const [scopedGroups, setScopedGroups] = useState<Group[]>(groups ?? []);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    useEffect(() => {
        if (groups) {
            setScopedGroups(groups);
            return;
        }

        if (titleId && isModalOpen) {
            setIsFetching(true);
            getGroupsByTitleId(String(titleId))
                .then(setScopedGroups)
                .finally(() => setIsFetching(false));
        }
    }, [groups, titleId, isModalOpen]);

    const showLoading = isLoading || isFetching;

    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-tertiary">
                    <h2 className="text-lg font-bold">Grupos de Tradução</h2>
                    <button
                        onClick={closeModal}
                        className="text-sm text-tertiary hover:text-white transition-colors cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>

                <div className="pt-3 max-h-80 overflow-y-auto">
                    {showLoading && (
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary animate-pulse bg-secondary/40"
                                >
                                    <div className="flex gap-3 items-center">
                                        <div className="w-12 h-12 rounded-full bg-tertiary" />
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <div className="w-2/3 h-4 rounded-xs bg-tertiary" />
                                            <div className="w-1/3 h-3 rounded-xs bg-tertiary" />
                                        </div>
                                    </div>
                                    <div className="w-full h-3 rounded-xs bg-tertiary" />
                                    <div className="w-1/2 h-3 rounded-xs bg-tertiary" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!showLoading && scopedGroups.length === 0 && (
                        <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                            <p className="text-tertiary text-center text-sm">
                                Nenhum grupo de tradução encontrado para esta
                                obra.
                            </p>
                        </div>
                    )}

                    {!showLoading && scopedGroups.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {scopedGroups.map(group => (
                                <GroupSummaryCard
                                    key={group.id}
                                    group={group}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default GroupsModal;
