import type { ForumTopic } from '@feature/forum';

const ForumStats = ({ topics }: { topics: ForumTopic[] }) => {
    const totalReplies = topics.reduce((s, t) => s + t.replyCount, 0);
    const totalViews = topics.reduce((s, t) => s + t.viewCount, 0);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
                { label: 'Tópicos', value: topics.length },
                { label: 'Respostas', value: totalReplies },
                { label: 'Visualizações', value: totalViews },
                {
                    label: 'Membros ativos',
                    value: new Set(topics.map(t => t.author.id)).size,
                },
            ].map(({ label, value }) => (
                <div
                    key={label}
                    className="p-3 text-center border rounded-lg bg-secondary border-tertiary"
                >
                    <p className="text-lg font-bold text-quaternary-default">
                        {value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-shadow-secondary">{label}</p>
                </div>
            ))}
        </div>
    );
};

export default ForumStats;
