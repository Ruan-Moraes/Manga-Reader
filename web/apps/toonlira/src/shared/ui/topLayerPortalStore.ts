/**
 * Registro do host de overlays do dialog nativo que está no topo da top layer.
 * Conteúdo em document.body, mesmo com z-index alto, fica atrás de um
 * HTMLDialogElement aberto com showModal().
 */
let hosts: HTMLElement[] = [];

const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) listener();
};

export const subscribeTopLayerPortalHost = (listener: () => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

export const getTopLayerPortalHost = (): HTMLElement | null => hosts.at(-1) ?? null;

export const registerTopLayerPortalHost = (host: HTMLElement) => {
    hosts = [...hosts.filter(item => item !== host), host];
    emit();

    return () => {
        hosts = hosts.filter(item => item !== host);
        emit();
    };
};
