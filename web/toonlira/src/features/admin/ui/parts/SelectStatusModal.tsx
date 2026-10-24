import { useEffect, useState } from 'react';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Select } from '@ui/Select';
import type { SelectOption } from '@ui/Select';

import Field from './Field';

type SelectStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    description?: string;
    fieldLabel: string;
    options: SelectOption[];
    currentValue: string;
    confirmLabel: string;
    cancelLabel: string;
    isSubmitting: boolean;
    /** Desabilita o confirmar enquanto o valor não muda (padrão). */
    disableWhenUnchanged?: boolean;
};

/**
 * Modal genérico de "selecionar e confirmar" (alterar status/role).
 * Base para UpdatePaymentStatus / UpdateSubscriptionStatus / ChangeRole / ChangeGroupRole.
 */
const SelectStatusModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    fieldLabel,
    options,
    currentValue,
    confirmLabel,
    cancelLabel,
    isSubmitting,
    disableWhenUnchanged = true,
}: SelectStatusModalProps) => {
    const [selected, setSelected] = useState<string>(currentValue);

    useEffect(() => {
        if (isOpen) setSelected(currentValue);
    }, [isOpen, currentValue]);

    const disabled = isSubmitting || (disableWhenUnchanged && selected === currentValue);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
            loading={isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={cancelLabel}
                    onCancel={onClose}
                    submitLabel={confirmLabel}
                    onSubmit={() => onConfirm(selected)}
                    submitDisabled={disabled}
                    submitting={isSubmitting}
                />
            }
        >
            <Field label={fieldLabel}>
                <Select value={selected} onChange={e => setSelected(e.target.value)} options={options} />
            </Field>
        </Modal>
    );
};

export default SelectStatusModal;
