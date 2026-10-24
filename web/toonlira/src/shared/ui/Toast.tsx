/**
 * Public entry for the design-system toast kit — the single, unified toast of the app.
 * Implementation split under `./toast/` (external store, provider/viewport, single-item view,
 * tone styles, types).
 *
 * Two ways to fire the same toast: the `useToast()` hook in components, or the imperative
 * `@shared/service/util/toastService` (`showSuccessToast`/`showErrorToast`/…) in services and
 * mutations. Both feed the same `toastStore` and render in this viewport.
 */
export { ToastProvider, useToast, default } from './toast/ToastProvider';
export type { ToastTone, ToastConfig, ToastApi } from './toast/types';
