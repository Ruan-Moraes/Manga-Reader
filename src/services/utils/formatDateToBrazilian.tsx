const formatDateToBrazilian = (isoDate: string): string => {
    if (!isoDate) return '';

    try {
        const [year, month, day] = isoDate.split('-');

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);

        return isoDate;
    }
};

export default formatDateToBrazilian;
