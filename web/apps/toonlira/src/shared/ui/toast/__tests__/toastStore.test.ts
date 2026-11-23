import { beforeEach, describe, expect, it } from 'vitest';

import { dismissToast, getToastsSnapshot, pushToast, subscribeToasts } from '../toastStore';

const clearAll = () => getToastsSnapshot().forEach(t => dismissToast(t.id));

describe('toastStore', () => {
    beforeEach(clearAll);

    it('adiciona toasts com os mais recentes no topo e notifica assinantes', () => {
        let notified = 0;
        const unsub = subscribeToasts(() => notified++);

        pushToast({ title: 'A' });
        pushToast({ title: 'B' });

        expect(getToastsSnapshot().map(t => t.title)).toEqual(['B', 'A']);
        expect(notified).toBe(2);
        unsub();
    });

    it('deduplica por id (substitui em vez de empilhar)', () => {
        pushToast({ id: 'x', title: 'primeiro' });
        pushToast({ id: 'x', title: 'segundo' });

        const snap = getToastsSnapshot();
        expect(snap).toHaveLength(1);
        expect(snap[0].title).toBe('segundo');
    });

    it('mantém no máximo 3 toasts visíveis', () => {
        ['1', '2', '3', '4'].forEach(t => pushToast({ title: t }));
        expect(getToastsSnapshot()).toHaveLength(3);
        expect(getToastsSnapshot().map(t => t.title)).toEqual(['4', '3', '2']);
    });

    it('dismiss remove o toast pelo id', () => {
        const id = pushToast({ title: 'tchau' });
        dismissToast(id);
        expect(getToastsSnapshot()).toHaveLength(0);
    });

    it('usa position "bottom" por padrão', () => {
        pushToast({ title: 'padrão' });
        expect(getToastsSnapshot()[0].position).toBe('bottom');
    });

    it('respeita position "top" quando informado', () => {
        pushToast({ title: 'topo', position: 'top' });
        expect(getToastsSnapshot()[0].position).toBe('top');
    });
});
