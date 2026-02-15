import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import GroupCard from '../../components/cards/groups/GroupCard';
import { mockGroups } from '../../services/mock/mockGroupService';

const Groups = () => {
    return (
        <>
            <Header />
            <Main>
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Grupos de Tradução</h2>
                    <p className="text-sm text-tertiary">
                        Explore grupos ativos e veja quais projetos cada equipe
                        traduz.
                    </p>
                </section>
                <section className="grid grid-cols-1 gap-3 mobile-md:grid-cols-2">
                    {mockGroups.map(group => (
                        <GroupCard key={group.id} group={group} />
                    ))}
                </section>
            </Main>
            <Footer />
        </>
    );
};

export default Groups;
