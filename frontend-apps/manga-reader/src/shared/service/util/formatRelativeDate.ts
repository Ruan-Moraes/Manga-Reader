// Single source of truth for relative-date labels (pt-BR).
// NOTE (i18n debt, deferred): strings are hardcoded pt-BR. Migrating to
// Intl.RelativeTimeFormat (locale-aware) is a separate i18n task — see DT-25.3.
const formatRelativeDate = (date: string): string => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    const diffMonths = Math.floor(diffDays / 30);
    return `há ${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'}`;
};

export default formatRelativeDate;
