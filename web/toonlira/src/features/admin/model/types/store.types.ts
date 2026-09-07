import type { LocalizedString } from '@shared/type/i18n';

export type AdminStore = {
    id: string;
    name: LocalizedString;
    website: string;
    logo: string | null;
    icon: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    displayOrder: number;
};

export type StoreRequest = Omit<AdminStore, 'id'>;
export type TitleStoreRef = { storeId: string; name?: string; logo?: string | null; url: string };
