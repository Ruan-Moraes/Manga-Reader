import { useState } from 'react';

import { type PrivacySettings, type VisibilitySetting } from '../../type/user.types';
import { updatePrivacySettings } from '../../service/userService';
import { showSuccessToast } from '@shared/service/util/toastService';

type Props = {
    privacySettings: PrivacySettings;
    onUpdate: () => void;
};

const options: { value: VisibilitySetting; label: string; description: string }[] = [
    { value: 'PUBLIC', label: 'Publico', description: 'Visivel para todos' },
    { value: 'PRIVATE', label: 'Privado', description: 'Apenas voce pode ver' },
    { value: 'DO_NOT_TRACK', label: 'Nao rastrear', description: 'Dados nao coletados' },
];

const PrivacySettingsForm = ({ privacySettings, onUpdate }: Props) => {
    const [commentVis, setCommentVis] = useState<VisibilitySetting>(privacySettings.commentVisibility);
    const [historyVis, setHistoryVis] = useState<VisibilitySetting>(privacySettings.viewHistoryVisibility);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (
            historyVis === 'DO_NOT_TRACK' &&
            privacySettings.viewHistoryVisibility !== 'DO_NOT_TRACK'
        ) {
            const confirmed = window.confirm(
                'Ao selecionar "Nao rastrear", todo o seu historico de visualizacao sera permanentemente deletado. Deseja continuar?',
            );
            if (!confirmed) return;
        }

        setSaving(true);
        try {
            await updatePrivacySettings({
                commentVisibility: commentVis,
                viewHistoryVisibility: historyVis,
            });
            showSuccessToast('Configuracoes de privacidade atualizadas.');
            onUpdate();
        } catch {
            // handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-4 py-3 space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-3">Visibilidade dos Comentarios</h3>
                <div className="space-y-2">
                    {options.filter(o => o.value !== 'DO_NOT_TRACK').map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="commentVis"
                                value={opt.value}
                                checked={commentVis === opt.value}
                                onChange={() => setCommentVis(opt.value)}
                                className="accent-quaternary"
                            />
                            <div>
                                <span className="text-sm">{opt.label}</span>
                                <p className="text-[10px] text-tertiary">{opt.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Visibilidade do Historico</h3>
                <div className="space-y-2">
                    {options.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="historyVis"
                                value={opt.value}
                                checked={historyVis === opt.value}
                                onChange={() => setHistoryVis(opt.value)}
                                className="accent-quaternary"
                            />
                            <div>
                                <span className="text-sm">{opt.label}</span>
                                <p className="text-[10px] text-tertiary">{opt.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50"
            >
                {saving ? 'Salvando...' : 'Salvar configuracoes'}
            </button>
        </div>
    );
};

export default PrivacySettingsForm;
