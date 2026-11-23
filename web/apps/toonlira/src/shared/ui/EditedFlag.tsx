export interface EditedFlagProps {
    label: string;
    title?: string;
}

export const EditedFlag = ({ label, title }: EditedFlagProps) => (
    <span className="text-ui-small italic text-ui-fg-subtle/80" title={title}>
        ({label})
    </span>
);

export default EditedFlag;
