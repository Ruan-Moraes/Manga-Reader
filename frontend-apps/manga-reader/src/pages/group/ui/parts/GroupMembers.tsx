import { Avatar } from '@ui/Avatar';

interface Member {
    name: string;
    role: string;
    joinedAt: string;
}

interface GroupMembersProps {
    members: Member[];
}

export const GroupMembers = ({ members }: GroupMembersProps) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(m => (
            <div key={m.name} className="flex items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-4">
                <Avatar name={m.name} size={48} />
                <div>
                    <p className="text-mr-small font-mr-bold text-mr-fg">{m.name}</p>
                    <p className="text-mr-tiny text-mr-fg-muted">{m.role}</p>
                    <p className="text-mr-tiny text-mr-fg-subtle">Entrou em {m.joinedAt}</p>
                </div>
            </div>
        ))}
    </div>
);
