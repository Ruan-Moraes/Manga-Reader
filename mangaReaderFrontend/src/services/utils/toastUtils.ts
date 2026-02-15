import { toast, ToastOptions, Id } from 'react-toastify';

const activeToasts = new Set<string>();

const showToast = (
    type: 'info' | 'success' | 'error' | 'warning',
    message: string,
    options?: ToastOptions,
) => {
    const toastKey = `${type}:${message}`;

    if (activeToasts.has(toastKey)) {
        return;
    }

    activeToasts.add(toastKey);

    const toastOptions: ToastOptions = {
        toastId: options?.toastId || toastKey,

        ...options,

        onClose: () => {
            activeToasts.delete(toastKey);

            if (options?.onClose) {
                options.onClose();
            }
        },
    };

    let toastId: Id;

    switch (type) {
        case 'info':
            toastId = toast.info(message, toastOptions);

            break;
        case 'success':
            toastId = toast.success(message, toastOptions);

            break;
        case 'error':
            toastId = toast.error(message, toastOptions);

            break;
        case 'warning':
            toastId = toast.warning(message, toastOptions);

            break;
    }

    return toastId;
};

export const showInfoToast = (message: string, options?: ToastOptions) =>
    showToast('info', message, options);

export const showSuccessToast = (message: string, options?: ToastOptions) =>
    showToast('success', message, options);

export const showErrorToast = (message: string, options?: ToastOptions) =>
    showToast('error', message, options);

export const showWarningToast = (message: string, options?: ToastOptions) =>
    showToast('warning', message, options);

export { toast };
