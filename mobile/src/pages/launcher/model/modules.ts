export type AppModuleId = 'platform' | 'offline-translation';
export type AppModuleAvailability = 'construction' | 'offline';

export interface AppModuleDescriptor {
    id: AppModuleId;
    availability: AppModuleAvailability;
    icon: 'book-outline' | 'language-outline';
}

export const APP_MODULES: readonly AppModuleDescriptor[] = [
    { id: 'platform', availability: 'construction', icon: 'book-outline' },
    { id: 'offline-translation', availability: 'offline', icon: 'language-outline' },
];
