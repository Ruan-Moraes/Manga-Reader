import { useCallback } from 'react';

import { useToast } from '@ui/Toast';

const TOAST_DURATION_MS = 2200;

/** Toast padrão de confirmação de mudança de configuração (tom accent, curto). */
export const useSettingsToast = () => {
    const { toast } = useToast();

    return useCallback(
        (title: string) => {
            toast({ tone: 'accent', title, duration: TOAST_DURATION_MS });
        },
        [toast],
    );
};

export default useSettingsToast;
