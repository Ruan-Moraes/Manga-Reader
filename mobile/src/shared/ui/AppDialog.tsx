import type { ReactNode } from 'react';

import { Button } from './Button';
import { CenterDialog, DialogAction } from './CenterDialog';
import type { IconName } from './Icon';

interface AppDialogProps {
    visible: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    destructive?: boolean;
    icon?: IconName;
    children?: ReactNode;
}

/** Simple confirm/cancel dialog on the shared centered {@link CenterDialog}. */
export function AppDialog({ visible, title, description, confirmLabel, cancelLabel, onConfirm, onCancel, destructive, icon, children }: AppDialogProps) {
    return (
        <CenterDialog
            visible={visible}
            onClose={onCancel}
            closeLabel={cancelLabel}
            title={title}
            description={description}
            icon={icon}
            tone={destructive ? 'danger' : 'accent'}
            actions={
                <>
                    <DialogAction>
                        <Button onPress={onCancel} variant="outline">
                            {cancelLabel}
                        </Button>
                    </DialogAction>
                    <DialogAction>
                        <Button onPress={onConfirm} tone={destructive ? 'danger' : 'accent'}>
                            {confirmLabel}
                        </Button>
                    </DialogAction>
                </>
            }
        >
            {children}
        </CenterDialog>
    );
}
