const formatDate = (
    date: Date | string,
    {
        year,
        month,
        day,
        hour,
        minute,
    }: {
        year?: 'numeric' | '2-digit';
        month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
        day?: 'numeric' | '2-digit';
        hour?: 'numeric' | '2-digit';
        minute?: 'numeric' | '2-digit';
    },
) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
        year,
        month,
        day,
        hour,
        minute,
    };

    return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
};

export default formatDate;
