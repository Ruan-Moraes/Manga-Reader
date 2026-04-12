import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import AdminUserList from '@feature/admin/component/AdminUserList';
import useAdminUsers from '@feature/admin/hook/useAdminUsers';

const DashboardUsers = () => {
    const {
        users,
        page,
        totalPages,
        totalElements,
        isLoading,
        search,
        setSearch,
        setPage,
    } = useAdminUsers();

    const [searchInput, setSearchInput] = useState(search);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Usuários</h1>
                <span className="text-sm text-tertiary">
                    {totalElements} usuários
                </span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <FiSearch
                        size={16}
                        className="absolute text-tertiary left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Buscar por nome ou email..."
                        className="w-full py-2 pl-9 pr-3 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    Buscar
                </button>
            </form>

            <AdminUserList
                users={users}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
            />
        </div>
    );
};

export default DashboardUsers;
