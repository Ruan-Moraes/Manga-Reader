import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';

import AdminUserDetail from '@feature/admin/component/AdminUserDetail';
import useAdminUserDetail from '@feature/admin/hook/useAdminUserDetail';

const DashboardUserDetail = () => {
    const { t } = useTranslation('admin');
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { user, isLoading, isError, refetch } = useAdminUserDetail(
        userId ?? '',
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

    if (isError || !user) {
        return (
            <div className="py-8 text-center">
                <p className="mb-2 text-sm text-tertiary">
                    {t('dashboard.users.errorDetail')}
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate('/Manga-Reader/dashboard/users')}
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                {t('common.back')}
            </button>
            <AdminUserDetail user={user} />
        </div>
    );
};

export default DashboardUserDetail;
