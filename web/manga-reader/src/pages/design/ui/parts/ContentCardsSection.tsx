import { Badge } from '@ui/Badge';
import { ChapterListItem } from '@entities/chapter';
import { EventCard } from '@entities/event';
import { ForumTopicCard } from '@entities/forum';
import { GroupCard } from '@entities/group';
import { MangaCard } from '@entities/manga';
import { MangaPoster } from '@ui/MangaPoster';
import { NotificationItem } from '@ui/NotificationItem';
import { ReviewCard } from '@entities/review';

import { PhaseHeader, Section, SubSection } from './showcaseShared';

export default function ContentCardsSection() {
    return (
        <>
            <PhaseHeader title="Fase 4 — Content Cards" />

            {/* MANGA POSTER */}
            <Section title="MangaPoster">
                <SubSection label="Tamanhos e formas">
                    <MangaPoster size={80} alt="Berserk" />
                    <MangaPoster size={120} shape="rect" radius="sm" />
                    <MangaPoster size={120} shape="square" radius="sm" />
                    <MangaPoster size={120} elevated cover="https://picsum.photos/seed/manga1/120/180" alt="Manga com capa" />
                    <MangaPoster size={100} fallbackGradient="linear-gradient(135deg, #1a1a4e, #0d0d2b)" radius="lg" elevated onClick={() => {}} />
                </SubSection>
            </Section>

            {/* MANGA CARD */}
            <Section title="MangaCard">
                <SubSection label="Variantes">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 w-full">
                        <MangaCard
                            manga={{
                                id: '1',
                                title: 'Berserk',
                                author: 'Kentaro Miura',
                                rating: 4.9,
                                chapter: 363,
                            }}
                            size="md"
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '2',
                                title: 'Solo Leveling',
                                author: 'Chugong',
                                cover: 'https://picsum.photos/seed/solo/200/300',
                                rating: 4.7,
                                chapter: 179,
                            }}
                            featured
                            tag={<Badge variant="accent">Top 1</Badge>}
                            size="md"
                            onToggleLibrary={() => {}}
                            inLibrary
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '3',
                                title: 'One Piece',
                                author: 'Oda',
                                cover: 'https://picsum.photos/seed/op/200/300',
                                chapter: 1120,
                            }}
                            progress={65}
                            size="md"
                            onToggleLibrary={() => {}}
                            onClick={() => {}}
                        />
                        <MangaCard
                            manga={{
                                id: '4',
                                title: 'Vinland Saga',
                                fallbackGradient: 'linear-gradient(135deg, #1a3a2a, #0d1a10)',
                                rating: 4.8,
                            }}
                            size="sm"
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* CHAPTER LIST ITEM */}
            <Section title="ChapterListItem">
                <SubSection label="Estados: lido, atual, com group">
                    <div className="w-full rounded-mr-xs border border-mr-border overflow-hidden">
                        <ChapterListItem
                            number={1120}
                            title="O amanhecer da nova era"
                            publishedAt="hoje"
                            group={{ name: 'Scan BR', avatar: undefined }}
                            downloaded
                            onMore={() => {}}
                            onClick={() => {}}
                        />
                        <ChapterListItem number={1119} publishedAt="há 3 dias" current group={{ name: 'Scan BR' }} onClick={() => {}} onMore={() => {}} />
                        <ChapterListItem
                            number={1118}
                            title="O encontro fatídico"
                            publishedAt="há 1 semana"
                            read
                            group={{ name: 'Scan BR' }}
                            onClick={() => {}}
                        />
                        <ChapterListItem number={1117} publishedAt="há 2 semanas" read onClick={() => {}} />
                    </div>
                </SubSection>
            </Section>

            {/* REVIEW CARD */}
            <Section title="ReviewCard">
                <SubSection label="Com e sem poster">
                    <div className="flex w-full flex-col gap-3">
                        <ReviewCard
                            author={{
                                name: 'Carlos Lima',
                                avatar: 'https://i.pravatar.cc/48?img=5',
                            }}
                            when="há 3 dias"
                            rating={5}
                            title="Uma obra prima atemporal"
                            manga={{
                                id: '1',
                                title: 'Berserk',
                                gradient: 'var(--mr-poster-gradient)',
                            }}
                            upvotes={247}
                            myVote="up"
                            badge="top"
                            onVote={() => {}}
                        >
                            Berserk transcende o gênero shounen. A arte de Miura é inigualável, cada página uma obra de arte. A jornada de Guts é das mais
                            épicas já contadas.
                        </ReviewCard>
                        <ReviewCard author={{ name: 'Luiza Santos' }} when="há 1 semana" rating={4} upvotes={53} onVote={() => {}}>
                            Ótima obra, mas o ritmo no início é lento. Vale muito a pena persistir.
                        </ReviewCard>
                    </div>
                </SubSection>
            </Section>

            {/* GROUP CARD */}
            <Section title="GroupCard">
                <SubSection label="Status e follow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <GroupCard
                            group={{
                                id: '1',
                                name: 'Scan Brasil',
                                handle: 'scanbr',
                                status: 'active',
                                members: 12500,
                                projects: 48,
                                chaptersPublished: 3200,
                                verified: true,
                                tags: ['PT-BR', 'Shounen', 'Seinen'],
                            }}
                            following
                            onToggleFollow={() => {}}
                            onClick={() => {}}
                        />
                        <GroupCard
                            group={{
                                id: '2',
                                name: 'Fansub MangaPT',
                                handle: 'mangapt',
                                status: 'hiatus',
                                members: 890,
                                projects: 12,
                                chaptersPublished: 400,
                                tags: ['PT-PT'],
                            }}
                            onToggleFollow={() => {}}
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* EVENT CARD */}
            <Section title="EventCard">
                <SubSection label="Special e Normal">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <EventCard
                            event={{
                                id: '1',
                                title: 'Lançamento: Berserk Vol. 42',
                                type: 'launch',
                                when: '15 jun · 18h',
                                location: 'Online',
                                attendees: 1240,
                                special: true,
                                going: false,
                                coverGradient: 'var(--mr-poster-gradient)',
                            }}
                            onToggleGoing={() => {}}
                            onClick={() => {}}
                        />
                        <div className="flex flex-col gap-3">
                            <EventCard
                                event={{
                                    id: '2',
                                    title: 'Meetup Manga SP',
                                    type: 'meetup',
                                    when: '22 jun',
                                    location: 'São Paulo / SP',
                                    attendees: 87,
                                }}
                                onClick={() => {}}
                            />
                            <EventCard
                                event={{
                                    id: '3',
                                    title: 'Live: Top 10 Manhwas 2025',
                                    type: 'stream',
                                    when: 'Hoje · 20h',
                                    attendees: 312,
                                }}
                                onClick={() => {}}
                            />
                            <EventCard
                                event={{
                                    id: '4',
                                    title: 'Encerrado: AnimeExpo',
                                    type: 'announcement',
                                    when: '10 mai',
                                    past: true,
                                }}
                                onClick={() => {}}
                            />
                        </div>
                    </div>
                </SubSection>
            </Section>

            {/* FORUM TOPIC CARD */}
            <Section title="ForumTopicCard">
                <SubSection label="Estados">
                    <div className="flex w-full flex-col gap-3">
                        <ForumTopicCard
                            id="1"
                            title="[Spoiler] Berserk Capítulo 363 — Teorias sobre o destino de Guts"
                            category="Spoiler livre"
                            author={{
                                name: 'FãBerserk99',
                                avatar: 'https://i.pravatar.cc/48?img=12',
                            }}
                            postedAt="há 2 horas"
                            lastReplyAt="há 5 min"
                            replies={312}
                            views={4200}
                            spoiler
                            live={47}
                            onClick={() => {}}
                        />
                        <ForumTopicCard
                            id="2"
                            title="Regras e boas-vindas ao fórum de Berserk"
                            category="Discussão"
                            author={{ name: 'Moderador' }}
                            postedAt="há 2 anos"
                            replies={5}
                            views={18000}
                            pinned
                            onClick={() => {}}
                        />
                        <ForumTopicCard
                            id="3"
                            title="Qual é sua cena favorita de toda a série?"
                            category="Discussão"
                            author={{ name: 'MangaFan2024' }}
                            postedAt="há 3 dias"
                            lastReplyAt="há 1 hora"
                            replies={89}
                            views={1100}
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* NOTIFICATION ITEM */}
            <Section title="NotificationItem">
                <SubSection label="Tipos e estados">
                    <div className="w-full rounded-mr-xs border border-mr-border overflow-hidden">
                        <NotificationItem
                            id="1"
                            kind="chapter"
                            actor={{
                                name: 'Scan Brasil',
                                avatar: 'https://i.pravatar.cc/48?img=8',
                            }}
                            text="Scan Brasil publicou o Capítulo 1120 de Berserk"
                            when="há 5 min"
                            unread
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="2"
                            kind="reply"
                            actor={{ name: 'Pedro Alves' }}
                            text="Pedro Alves respondeu seu comentário em Berserk"
                            preview="Concordo, a arte de Miura é inigualável..."
                            when="há 2 horas"
                            unread
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="3"
                            kind="mention"
                            actor={{
                                name: 'Mariana Costa',
                                avatar: 'https://i.pravatar.cc/48?img=9',
                            }}
                            text="Mariana Costa mencionou você em Fórum"
                            when="há 4 horas"
                            onDismiss={() => {}}
                            onClick={() => {}}
                        />
                        <NotificationItem
                            id="4"
                            kind="system"
                            text="Nova funcionalidade: Listas de leitura personalizadas"
                            when="há 1 dia"
                            onClick={() => {}}
                        />
                    </div>
                </SubSection>
            </Section>

            {/* TOKEN PALETTE */}
            <Section title="Paleta de tokens">
                <SubSection label="Cores">
                    {[
                        ['mr-primary', 'bg-mr-primary'],
                        ['mr-secondary', 'bg-mr-secondary'],
                        ['mr-tertiary', 'bg-mr-tertiary'],
                        ['mr-accent', 'bg-mr-accent'],
                        ['mr-danger', 'bg-mr-danger'],
                        ['mr-gray-900', 'bg-mr-gray-900'],
                        ['mr-gray-800', 'bg-mr-gray-800'],
                        ['mr-gray-700', 'bg-mr-gray-700'],
                        ['mr-gray-500', 'bg-mr-gray-500'],
                        ['mr-gray-300', 'bg-mr-gray-300'],
                    ].map(([label, cls]) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <div className={`size-10 rounded-mr-xs border border-mr-gray-700 ${cls}`} />
                            <span className="text-[10px] text-mr-fg-muted">{label}</span>
                        </div>
                    ))}
                </SubSection>
                <SubSection label="Tipografia">
                    <div className="flex w-full flex-col gap-2">
                        <p className="text-mr-h1">H1 — Nunito Sans ExtraBold</p>
                        <p className="text-mr-h2">H2 — Nunito Sans ExtraBold</p>
                        <p className="text-mr-h3">H3 — Nunito Sans Bold</p>
                        <p className="text-mr-h4">H4 — Nunito Sans Bold</p>
                        <p className="text-mr-body">Body — Nunito Sans Regular (14px / 1.55)</p>
                        <p className="text-mr-small">Small — 12px / 1.4</p>
                        <p className="text-mr-tiny">Tiny — 11px / 1.3</p>
                    </div>
                </SubSection>
                <SubSection label="Sombras">
                    <div className="flex gap-6">
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-default text-mr-small">shadow-mr-default</div>
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-elevated text-mr-small">shadow-mr-elevated</div>
                        <div className="rounded-mr-sm bg-mr-secondary p-4 shadow-mr-overlay text-mr-small">shadow-mr-overlay</div>
                    </div>
                </SubSection>
            </Section>
        </>
    );
}
