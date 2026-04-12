import type { AdminPayment } from '@feature/admin/type/admin.types';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

let adminPaymentCounter = 0;

const PAYMENT_STATUSES = [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
] as const;

export const buildAdminPayment = (
    overrides: Partial<AdminPayment> = {},
): AdminPayment => {
    adminPaymentCounter += 1;

    return {
        id: `admin-payment-${adminPaymentCounter}`,
        userId: `user-${adminPaymentCounter}`,
        amount: 49.9,
        currency: 'BRL',
        status: 'PENDING',
        paymentMethod: 'PIX',
        description: 'Pagamento padrao de teste.',
        referenceType: 'SUBSCRIPTION',
        referenceId: `sub-${adminPaymentCounter}`,
        paidAt: null,
        createdAt: '2026-03-15T10:00:00Z',
        updatedAt: null,
        ...overrides,
    };
};

export const adminPaymentPresets = {
    pending: () => buildAdminPayment({ status: 'PENDING', paidAt: null }),
    completed: () =>
        buildAdminPayment({
            status: 'COMPLETED',
            paidAt: '2026-03-15T10:30:00Z',
            updatedAt: '2026-03-15T10:30:00Z',
        }),
    failed: () =>
        buildAdminPayment({
            status: 'FAILED',
            paidAt: null,
            description: 'Falha no processamento.',
        }),
    refunded: () =>
        buildAdminPayment({
            status: 'REFUNDED',
            paidAt: '2026-03-15T10:30:00Z',
            updatedAt: '2026-03-20T10:00:00Z',
            description: 'Reembolso solicitado pelo usuario.',
        }),

    pix: () => buildAdminPayment({ paymentMethod: 'PIX' }),
    creditCard: () => buildAdminPayment({ paymentMethod: 'CREDIT_CARD' }),
    boleto: () => buildAdminPayment({ paymentMethod: 'BOLETO' }),
    paypal: () => buildAdminPayment({ paymentMethod: 'PAYPAL' }),

    highValue: () =>
        buildAdminPayment({ amount: 9999.99, paymentMethod: 'CREDIT_CARD' }),
    lowValue: () => buildAdminPayment({ amount: 1.0 }),
    free: () => buildAdminPayment({ amount: 0 }),

    foreignCurrency: () => buildAdminPayment({ currency: 'USD', amount: 9.99 }),

    minimal: () =>
        buildAdminPayment({
            paymentMethod: null,
            description: null,
            referenceType: null,
            referenceId: null,
        }),

    subscription: () =>
        buildAdminPayment({
            referenceType: 'SUBSCRIPTION',
            description: 'Assinatura mensal Premium',
        }),
    donation: () =>
        buildAdminPayment({
            referenceType: 'DONATION',
            referenceId: null,
            description: 'Doacao apoio ao site',
        }),
};

export const buildAdminPaymentList = (count = 10): AdminPayment[] =>
    Array.from({ length: count }, (_, i) =>
        buildAdminPayment({ status: PAYMENT_STATUSES[i % 4] }),
    );

export const buildAdminPaymentPage = (
    items: AdminPayment[] = buildAdminPaymentList(),
    page = 0,
    size = 20,
): PageResponse<AdminPayment> => buildPage(items, page, size);

export const adminPaymentStatusValues = [
    ...PAYMENT_STATUSES,
] as const satisfies readonly string[];
