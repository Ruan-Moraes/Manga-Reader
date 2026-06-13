export interface EditedFlagProps {
    label: string;
    title?: string;
}

export const EditedFlag = ({ label, title }: EditedFlagProps) => (
    <span className="text-mr-small italic text-mr-fg-subtle/80" title={title}>
        ({label})
    </span>
);

export default EditedFlag;
