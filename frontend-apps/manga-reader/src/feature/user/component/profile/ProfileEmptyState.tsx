type Props = {
    message: string;
};

const ProfileEmptyState = ({ message }: Props) => {
    return (
        <div className="flex items-center justify-center p-8">
            <p className="text-sm text-tertiary">{message}</p>
        </div>
    );
};

export default ProfileEmptyState;
