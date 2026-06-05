export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-10">
        <h2 className="mb-4 border-b border-mr-gray-700 pb-2 text-mr-h4 text-mr-fg-muted uppercase tracking-[0.1em]">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
);

export const SubSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="w-full">
        <p className="mb-2 text-mr-tiny text-mr-fg-muted uppercase tracking-widest">{label}</p>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
);

export const PhaseHeader = ({ title }: { title: string }) => (
    <>
        <h1 className="mb-2 mt-12 text-mr-h1">{title}</h1>
        <div className="mb-10 h-px bg-mr-border" />
    </>
);

export const GENRE_OPTIONS = [
    { value: 'action', label: 'Ação' },
    { value: 'romance', label: 'Romance' },
    { value: 'comedy', label: 'Comédia' },
    { value: 'horror', label: 'Terror', disabled: true },
];

export const READING_OPTIONS = [
    { value: 'reading', label: 'Lendo', hint: 'Atualmente em progresso' },
    { value: 'completed', label: 'Completo' },
    { value: 'dropped', label: 'Abandonado', hint: 'Parei de ler' },
    { value: 'plan', label: 'Quero ler' },
];
