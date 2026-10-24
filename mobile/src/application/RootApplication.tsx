import { ContentLanguagesAccountGate, DataControlsAccountGate, PrivacyAccountGate, SessionGate, SettingsAccountGate, SettingsGate } from './gates';
import { RootNavigator } from './navigation';
import { AppProviders } from './providers';

export function RootApplication() {
    return (
        <AppProviders>
            <SettingsGate>
                <SessionGate>
                    <SettingsAccountGate>
                        <PrivacyAccountGate>
                            <ContentLanguagesAccountGate>
                                <DataControlsAccountGate>
                                    <RootNavigator />
                                </DataControlsAccountGate>
                            </ContentLanguagesAccountGate>
                        </PrivacyAccountGate>
                    </SettingsAccountGate>
                </SessionGate>
            </SettingsGate>
        </AppProviders>
    );
}
