type Props = {
    name: string;
    role: string;
    bio?: string;
    createdAt?: string;
    isOwner: boolean;
    onEdit?: () => void;
};

const roleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'poster': return 'Postador';
        default: return 'Leitor';
    }
};

const roleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin': return 'bg-quinary-default/20 text-quinary-default';
        case 'poster': return 'bg-quaternary/20 text-quaternary';
        default: return 'bg-tertiary/20 text-tertiary';
    }
};

const ProfileHeader = ({ name, role, bio, createdAt, isOwner, onEdit }: Props) => {
    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
          })
        : null;

    return (
        <div className="pt-14 px-4 pb-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">{name}</h1>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeColor(role)}`}>
                            {roleLabel(role)}
                        </span>
                    </div>
                    {formattedDate && (
                        <p className="text-xs text-tertiary mt-1">
                            Membro desde {formattedDate}
                        </p>
                    )}
                </div>
                {isOwner && onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 text-xs font-medium border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    >
                        Editar perfil
                    </button>
                )}
            </div>
            {bio && (
                <p className="mt-3 text-sm text-tertiary">{bio}</p>
            )}
        </div>
    );
};

export default ProfileHeader;
