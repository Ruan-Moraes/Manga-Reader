import type { ComponentType } from 'react';

import type { ActivityEvent } from '../../model/activity.types';

/**
 * Cada renderer recebe o evento inteiro (a união) e faz a narrowing do seu
 * próprio payload internamente — permite manter o registro tipo→componente
 * como um `Record` simples, sem variância genérica complicada.
 */
export type ActivityRowRenderer = ComponentType<{ event: ActivityEvent }>;
