export type AppModuleId = 'platform' | 'offline-translation';
export type AppModuleAvailability = 'construction' | 'local-first';

export interface AppModuleDescriptor {
    id: AppModuleId;
    availability: AppModuleAvailability;
    icon: 'book-outline' | 'language-outline';
}

export const APP_MODULES: readonly AppModuleDescriptor[] = [
    { id: 'offline-translation', availability: 'local-first', icon: 'language-outline' },
    { id: 'platform', availability: 'construction', icon: 'book-outline' },
];
