import { Icon, type IconName as SharedIconName } from '@/shared/ui';

type IconName = 'mail' | 'lock' | 'eye' | 'eye-off' | 'check' | 'user' | 'arrow-left' | 'send' | 'alert';

interface Props {
    name: IconName;
    size?: number;
    color?: string;
    strokeWidth?: number;
}

const ICONS: Record<IconName, SharedIconName> = {
    mail: 'mail-outline',
    lock: 'lock-closed-outline',
    eye: 'eye-outline',
    'eye-off': 'eye-off-outline',
    check: 'checkmark',
    user: 'person-outline',
    'arrow-left': 'arrow-back',
    send: 'send-outline',
    alert: 'alert-circle-outline',
};

export function MRIcon({ name, size = 20, color }: Props) {
    return <Icon name={ICONS[name]} size={size} color={color} decorative />;
}
