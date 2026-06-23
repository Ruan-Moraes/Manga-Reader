import { setupServer } from 'msw/node';

import { statsHandlers } from './handlers/statsHandlers';
import { plansHandlers } from './handlers/plansHandlers';

export const server = setupServer(...statsHandlers, ...plansHandlers);
