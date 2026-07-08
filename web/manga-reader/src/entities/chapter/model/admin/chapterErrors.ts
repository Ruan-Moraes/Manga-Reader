import type { ChapterValidationError } from './chapterAdmin.types';

/**
 * Erro de domínio lançado pelos gateways quando uma regra é violada.
 * A UI captura, lê `violation.code` e traduz via i18n.
 */
export class ChapterDomainError extends Error {
    readonly violation: ChapterValidationError;

    constructor(violation: ChapterValidationError) {
        super(`chapter domain rule violated: ${violation.code}`);
        this.name = 'ChapterDomainError';
        this.violation = violation;
    }
}
