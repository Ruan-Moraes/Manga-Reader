import type { LocalizedString } from '@shared/type/i18n';

export type AdminTag = {
    value: number;
    label: LocalizedString;
};

export type CreateTagRequest = {
    label: LocalizedString;
};

export type UpdateTagRequest = {
    label: LocalizedString;
};
