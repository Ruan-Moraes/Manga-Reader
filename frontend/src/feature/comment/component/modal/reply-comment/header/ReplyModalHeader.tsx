import { MdQuickreply } from 'react-icons/md';

type ReplyModalHeaderProps = {
    title: string;
};

const ReplyModalHeader = ({ title }: ReplyModalHeaderProps) => {
    return (
        <div>
            <h2 className="flex items-center justify-center gap-2 text-lg font-bold leading-none text-center text-quaternary-default">
                <MdQuickreply size={23} fill="#ddda2a" /> {title}
            </h2>
        </div>
    );
};

export default ReplyModalHeader;
