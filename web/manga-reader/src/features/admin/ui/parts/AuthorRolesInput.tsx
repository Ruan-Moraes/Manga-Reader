import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { Select } from '@ui/Select';
import { cn } from '@shared/lib/cn';

import { getAdminAuthors } from '../../api/adminAuthorService';
import type { AdminAuthor, TitleAuthorRef } from '../../model/admin.types';
import EntitySearchSelect from './EntitySearchSelect';

export const AUTHOR_ROLES = ['AUTHOR', 'ARTIST', 'STORY', 'LETTERER', 'COLORIST', 'EDITOR'] as const;

type AuthorRolesInputProps = {
    value: TitleAuthorRef[];
    onChange: (next: TitleAuthorRef[]) => void;
};

const AuthorRolesInput = ({ value, onChange }: AuthorRolesInputProps) => {
    const { t } = useTranslation('admin');

    const roleOptions = AUTHOR_ROLES.map(role => ({ value: role, label: t(`titleAuthorRole.${role}`, role) }));

    const addAuthor = (author: AdminAuthor) => {
        onChange([...value, { authorId: Number(author.id), authorName: author.name, role: 'AUTHOR' }]);
    };

    const setRole = (index: number, role: string) => {
        onChange(value.map((entry, i) => (i === index ? { ...entry, role } : entry)));
    };

    const remove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col gap-2">
            {value.map((entry, index) => (
                <div key={`${entry.authorId}-${index}`} className="flex items-center gap-2 rounded-mr-sm border border-mr-gray-900 bg-mr-surface-muted px-2.5 py-2">
                    <span className="min-w-0 flex-1 truncate font-mr-bold text-mr-fg">{entry.authorName ?? `#${entry.authorId}`}</span>
                    <div className="w-40 shrink-0">
                        <Select value={entry.role} onChange={e => setRole(index, e.target.value)} options={roleOptions} />
                    </div>
                    <button
                        type="button"
                        aria-label={t('dashboard.titles.form.removeAuthor')}
                        onClick={() => remove(index)}
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-mr-xs border border-[rgba(255,120,79,0.4)] text-mr-danger transition-colors hover:bg-mr-danger-15',
                        )}
                    >
                        <X size={15} />
                    </button>
                </div>
            ))}

            <EntitySearchSelect<AdminAuthor>
                queryKey="adminAuthorSearch"
                fetcher={async term => (await getAdminAuthors(0, 10, term || undefined)).content}
                getKey={author => author.id}
                getLabel={author => author.name}
                onPick={addAuthor}
                placeholder={t('dashboard.titles.form.authorsSearch')}
                excludeKeys={value.map(entry => String(entry.authorId))}
                emptyLabel={t('dashboard.titles.form.authorsEmpty')}
            />
        </div>
    );
};

export default AuthorRolesInput;
