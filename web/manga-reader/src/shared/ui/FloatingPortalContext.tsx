import { createContext, useContext } from 'react';

/**
 * Container para portais de conteúdo flutuante (menus de select, popovers,
 * calendários) aberto dentro de um contêiner que cria camada própria — hoje,
 * o `<dialog>` do Modal, que vive na top layer do navegador e cobriria
 * qualquer portal em `document.body`.
 *
 * `null` (padrão) => as libs portalam para `document.body`, comportamento
 * normal fora de modais.
 */
export const FloatingPortalContext = createContext<HTMLElement | null>(null);

export const useFloatingPortalContainer = (): HTMLElement | null => useContext(FloatingPortalContext);
