import { type PropsWithChildren, useState } from 'react';
import { Pressable, View } from 'react-native';

import type { AdultContentPreference } from '../model/privacy';

interface SensitiveContentGuardProps extends PropsWithChildren {
    adult: boolean;
    preference: AdultContentPreference | null;
    revealLabel: string;
}

export function SensitiveContentGuard({ adult, children, preference, revealLabel }: SensitiveContentGuardProps) {
    const [revealed, setRevealed] = useState(false);

    if (!adult || preference === 'SHOW') return children;
    if (preference === null || preference === 'HIDE') return null;
    if (revealed) return children;

    return (
        <Pressable accessibilityLabel={revealLabel} accessibilityRole="button" onPress={() => setRevealed(true)}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ minHeight: 48 }} />
        </Pressable>
    );
}
