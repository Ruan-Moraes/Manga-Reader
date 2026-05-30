export const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <p className="mb-4 text-mr-tiny font-mr-bold uppercase tracking-wider text-mr-fg-subtle">{title}</p>
        <div className="flex flex-col gap-5 max-w-[480px]">{children}</div>
    </section>
);

export const SettingRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
            <p className="text-mr-small font-mr-bold text-mr-fg">{label}</p>
            {hint && <p className="mt-0.5 text-mr-tiny text-mr-fg-subtle">{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);
