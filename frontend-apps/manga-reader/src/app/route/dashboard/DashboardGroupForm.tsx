import { useState, useEffect } from 'react';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getAdminGroupDetail } from '@feature/admin/service/adminGroupService';
import useAdminGroupActions from '@feature/admin/hook/useAdminGroupActions';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';

const DashboardGroupForm = () => {
    const { t } = useTranslation('admin');
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    const { handleUpdate, isSubmitting } = useAdminGroupActions();

    const { data: existing, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_GROUP_DETAIL, groupId],
        queryFn: () => getAdminGroupDetail(groupId!),
        enabled: Boolean(groupId),
    });

    const [logo, setLogo] = useState('');
    const [banner, setBanner] = useState('');
    const [website, setWebsite] = useState('');
    const [name, setName] = useState<LocalizedString>({});
    const [description, setDescription] = useState<LocalizedString>({});

    useEffect(() => {
        if (existing) {
            setLogo(existing.logo ?? '');
            setBanner('');
            setWebsite('');
            setName(existing.name ?? {});
            setDescription(existing.description ?? {});
        }
    }, [existing]);

    const ptName = (name[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !ptName) return;
        const result = await handleUpdate(groupId, {
            name,
            description,
            ...(logo ? { logo } : {}),
            ...(banner ? { banner } : {}),
            ...(website ? { website } : {}),
        });
        if (result) navigate(`${WEB_BASE_URL}/dashboard/groups/${groupId}`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="w-32 h-8 rounded-xs bg-tertiary/30 animate-pulse" />
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() =>
                    navigate(`${WEB_BASE_URL}/dashboard/groups/${groupId}`)
                }
                className="flex items-center gap-1 text-sm w-fit hover:text-quaternary-default"
            >
                <FiArrowLeft size={14} />
                {t('common.back', 'Voltar')}
            </button>

            <h1 className="text-lg font-bold">
                {t('dashboard.groups.editTitle', 'Editar Grupo')}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <LocalizedTextInput
                    label={t('groupForm.name', 'Nome')}
                    value={name}
                    onChange={setName}
                    maxLength={100}
                />

                <LocalizedTextInput
                    label={t('groupForm.description', 'Descrição')}
                    value={description}
                    onChange={setDescription}
                    multiline
                    rows={4}
                    requiredLanguages={[]}
                    maxLength={2000}
                />

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('groupForm.logo', 'Logo (URL)')}
                    </span>
                    <input
                        value={logo}
                        onChange={e => setLogo(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('groupForm.banner', 'Banner (URL)')}
                    </span>
                    <input
                        value={banner}
                        onChange={e => setBanner(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-tertiary">
                        {t('groupForm.website', 'Website')}
                    </span>
                    <input
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </label>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || !ptName}
                        className="px-4 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.saving', 'Salvando...')
                            : t('common.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DashboardGroupForm;
