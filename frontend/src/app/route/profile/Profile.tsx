import { useState } from 'react';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { useAuth } from '@feature/auth';
import { showSuccessToast } from '@shared/service/util/toastService';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name ?? '');
    const [bio, setBio] = useState(user?.bio ?? '');

    return (
        <>
            <Header />
            <MainContent>
                <section className="p-4 border rounded-xs border-tertiary bg-secondary/30">
                    <h2 className="mb-4 text-xl font-bold">
                        Perfil do Usuário
                    </h2>
                    {user ? (
                        <div className="grid gap-4 mobile-md:grid-cols-[120px_1fr] items-start">
                            <img
                                src={user.photo}
                                alt={user.name}
                                className="object-cover w-28 h-28 border rounded-full border-tertiary"
                            />
                            <form
                                className="flex flex-col gap-3"
                                onSubmit={event => {
                                    event.preventDefault();
                                    updateProfile({ name, bio });
                                    showSuccessToast(
                                        'Perfil atualizado com sucesso.',
                                    );
                                }}
                            >
                                <label className="text-sm">
                                    Nome
                                    <input
                                        value={name}
                                        onChange={event =>
                                            setName(event.target.value)
                                        }
                                        className="w-full px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                                    />
                                </label>
                                <label className="text-sm">
                                    Bio
                                    <textarea
                                        value={bio}
                                        onChange={event =>
                                            setBio(event.target.value)
                                        }
                                        className="w-full h-24 px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                                    />
                                </label>
                                <button className="px-3 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors">
                                    Salvar alterações
                                </button>
                            </form>
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">
                            Faça login para visualizar seu perfil.
                        </p>
                    )}
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default Profile;
