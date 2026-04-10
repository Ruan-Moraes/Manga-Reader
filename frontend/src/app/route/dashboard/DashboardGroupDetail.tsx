import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

import AdminGroupDetail from '@feature/admin/component/AdminGroupDetail';
import useAdminGroupDetail from '@feature/admin/hook/useAdminGroupDetail';

const DashboardGroupDetail = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { group, isLoading, isError, refetch } = useAdminGroupDetail(
        groupId ?? '',
    );

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="h-8 rounded-xs bg-tertiary/30 animate-pulse w-32" />
                <div className="h-32 rounded-xs bg-tertiary/30 animate-pulse" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-40 rounded-xs bg-tertiary/30 animate-pulse" />
                    <div className="h-40 rounded-xs bg-tertiary/30 animate-pulse" />
                </div>
            </div>
        );
    }

    if (isError || !group) {
        return (
            <div className="py-8 text-center">
                <p className="mb-2 text-sm text-tertiary">
                    Erro ao carregar detalhes do grupo.
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate('/Manga-Reader/dashboard/groups')}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                Voltar para lista
            </button>
            <AdminGroupDetail group={group} />
        </div>
    );
};

export default DashboardGroupDetail;
