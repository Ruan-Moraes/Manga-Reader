import { Pencil } from 'lucide-react';
type EditModalHeaderProps = {
    title: string;
};

const EditModalHeader = ({ title }: EditModalHeaderProps) => {
    return (
        <div>
            <h2 className="flex items-center justify-center gap-2 text-lg font-bold leading-none text-center text-mr-accent-fg">
                <Pencil size={23} fill="var(--mr-accent)" /> {title}
            </h2>
        </div>
    );
};

export default EditModalHeader;
