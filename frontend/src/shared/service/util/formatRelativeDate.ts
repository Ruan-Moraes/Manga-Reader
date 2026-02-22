const formatRelativeDate = (date: string): string => {
    const diffInHours = Math.floor(
        (Date.now() - new Date(date).getTime()) / 3_600_000,
    );

    if (diffInHours < 1) return 'agora mesmo';
    if (diffInHours < 24)
        return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

export default formatRelativeDate;
