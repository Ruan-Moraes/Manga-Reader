import { PageContainer } from '@ui/PageContainer';

const shimmer = 'animate-pulse rounded bg-mr-tertiary/20';

/**
 * Placeholder de carregamento da página de Título. Espelha o layout final
 * (TitleHero + barra de abas + conteúdo) para evitar salto visual quando a
 * obra termina de carregar.
 */
const TitleDetailsSkeleton = () => (
    <PageContainer asMain size="default" paddingY="md">
        {/* Hero: capa + coluna de metadados (espelha TitleHero) */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:gap-8">
            <div className={`h-[220px] w-[156px] shrink-0 self-start rounded-mr-md ${shimmer}`} />

            <div className="flex-1 min-w-0 space-y-3 py-1">
                {/* Badges de gênero */}
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`h-5 w-16 rounded-mr-full ${shimmer}`} />
                    ))}
                </div>
                <div className={`h-8 w-2/3 ${shimmer}`} />
                <div className={`h-4 w-1/3 ${shimmer}`} />
                <div className={`h-5 w-40 ${shimmer}`} />
                {/* Sinopse */}
                <div className="space-y-2 pt-1">
                    <div className={`h-3 w-full ${shimmer}`} />
                    <div className={`h-3 w-11/12 ${shimmer}`} />
                    <div className={`h-3 w-4/5 ${shimmer}`} />
                </div>
                {/* Botões de ação */}
                <div className="flex flex-wrap gap-2 pt-1">
                    <div className={`h-10 w-36 rounded-mr-md ${shimmer}`} />
                    <div className={`h-10 w-32 rounded-mr-md ${shimmer}`} />
                    <div className={`h-10 w-10 rounded-mr-md ${shimmer}`} />
                </div>
            </div>
        </div>

        {/* Barra de abas (espelha <Tabs>) */}
        <div className="mb-6 flex gap-4 border-b border-mr-border pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-5 w-20 ${shimmer}`} />
            ))}
        </div>

        {/* Conteúdo (espelha a aba Capítulos default) */}
        <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-14 w-full rounded-mr-md ${shimmer}`} />
            ))}
        </div>
    </PageContainer>
);

export default TitleDetailsSkeleton;
