/**
 * Public entry for the design-system toast kit. Implementation split under
 * `./toast/` (provider/state, single-item view, tone styles, types).
 *
 * Note: this is the DS in-app toast (used by `main.tsx` + design showcase). The
 * app's transactional notifications use the separate react-toastify
 * `@shared/service/util/toastService`.
 */
export { ToastProvider, useToast, default } from './toast/ToastProvider';
export type { ToastTone, ToastConfig, ToastApi } from './toast/types';
