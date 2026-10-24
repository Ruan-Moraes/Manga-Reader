import type { IconName } from '@/shared/component/Icon';
import type { MockScreenName } from '@/shared/component/mock-screen';

export type DemoTabId = 'library' | 'title' | 'reader' | 'profile';

export interface DemoTabDefinition {
    id: DemoTabId;
    labelKey: string;
    icon: IconName;
    screen: MockScreenName;
    url: string;
}

export const DEMO_TABS: readonly DemoTabDefinition[] = [
    {
        id: 'library',
        labelKey: 'demo.tabs.library',
        icon: 'library',
        screen: 'LibraryScreen',
        url: 'toonlira-rm.firebaseapp.com/biblioteca',
    },
    {
        id: 'title',
        labelKey: 'demo.tabs.title',
        icon: 'eye',
        screen: 'TitleScreen',
        url: 'toonlira-rm.firebaseapp.com/obra/frieren',
    },
    {
        id: 'reader',
        labelKey: 'demo.tabs.reader',
        icon: 'play',
        screen: 'ReaderScreen',
        url: 'toonlira-rm.firebaseapp.com/ler/frieren-140',
    },
    {
        id: 'profile',
        labelKey: 'demo.tabs.profile',
        icon: 'user',
        screen: 'ProfileScreen',
        url: 'toonlira-rm.firebaseapp.com/perfil',
    },
] as const;
