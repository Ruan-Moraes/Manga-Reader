import BaseModal from '../../base/BaseModal';
import GroupsContainer from '../../../cards/groups/GroupsContainer';
import { GroupTypes } from '../../../../types/GroupTypes';

type GroupsModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    groups?: GroupTypes[];
    isLoading?: boolean;
    titleId?: string;
};

// Dados mockados para demonstração
const mockGroups: GroupTypes[] = [
    {
        id: '1',
        name: 'Scan Supremo',
        logo: 'https://via.placeholder.com/150x100/4F46E5/FFFFFF?text=SS',
        description: 'Grupo especializado em mangás de ação e aventura com traduções de alta qualidade.',
        website: 'https://scansupremo.com',
        discord: 'https://discord.gg/scansupremo',
        totalTitles: 45,
        foundedYear: 2019,
        status: 'active'
    },
    {
        id: '2',
        name: 'Mangás Brasil',
        logo: 'https://via.placeholder.com/150x100/10B981/FFFFFF?text=MB',
        description: 'Traduzindo os melhores mangás para o público brasileiro há mais de 5 anos.',
        website: 'https://mangasbrasil.com',
        totalTitles: 78,
        foundedYear: 2018,
        status: 'active'
    },
    {
        id: '3',
        name: 'Otaku Scans',
        logo: 'https://via.placeholder.com/150x100/F59E0B/FFFFFF?text=OS',
        description: 'Focados em romance e slice of life, trazendo histórias emocionantes.',
        discord: 'https://discord.gg/otakuscans',
        totalTitles: 23,
        foundedYear: 2020,
        status: 'hiatus'
    },
    {
        id: '4',
        name: 'Legendary Scans',
        description: 'Grupo que traduziu alguns dos mangás mais populares, atualmente inativo.',
        totalTitles: 156,
        foundedYear: 2015,
        status: 'inactive'
    }
];

const GroupsModal = ({
    isModalOpen,
    closeModal,
    groups = mockGroups,
    isLoading = false,
    titleId
}: GroupsModalProps) => {
    return (
        <BaseModal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-tertiary">
                    <h2 className="text-lg font-bold">Grupos de Tradução</h2>
                    <button
                        onClick={closeModal}
                        className="text-tertiary hover:text-primary transition-colors"
                        aria-label="Fechar modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-80 overflow-y-auto">
                    <GroupsContainer
                        groups={groups}
                        isLoading={isLoading}
                        title=""
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-tertiary">
                    <button
                        onClick={closeModal}
                        className="px-3 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

export default GroupsModal;