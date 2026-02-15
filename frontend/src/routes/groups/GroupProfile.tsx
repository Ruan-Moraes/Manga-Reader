import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import CustomLink from '../../components/links/elements/CustomLink';
import Warning from '../../components/notifications/Warning';
import { COLORS } from '../../constants/COLORS';
import { mockGroups } from '../../services/mock/mockGroupService';

const GroupProfile = () => {
    const { groupId } = useParams();

    const group = useMemo(
        () => mockGroups.find(item => item.id === groupId),
        [groupId],
    );

    if (!group) {
        return (
            <Main>
                <Warning
                    color={COLORS.QUINARY}
                    title="Grupo não encontrado"
                    message="Não foi possível localizar o perfil solicitado."
                    link="/groups"
                    linkText="Voltar para Grupos"
                />
            </Main>
        );
    }

    return (
        <>
            <Header />
            <Main>
                <section className="flex flex-col gap-2 p-4 border rounded-xs border-tertiary">
                    <h2 className="text-xl font-bold">{group.name}</h2>
                    <p className="text-sm text-tertiary">{group.description}</p>
                    <p className="text-sm">
                        Status: <strong>{group.status}</strong> · Membros:{' '}
                        {group.members.join(', ')}
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h3 className="font-bold">Mangás traduzidos</h3>
                    <div className="flex flex-col gap-1">
                        {group.translatedTitleIds.map(titleId => (
                            <CustomLink
                                key={titleId}
                                link={`/titles/${titleId}`}
                                text={`Obra #${titleId}`}
                            />
                        ))}
                    </div>
                </section>
            </Main>
            <Footer />
        </>
    );
};

export default GroupProfile;
