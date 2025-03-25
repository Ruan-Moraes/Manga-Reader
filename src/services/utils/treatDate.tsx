const treatDate = (
  date: Date,
  {
    year = 'numeric',
    month = 'numeric',
    day,
    hour,
    minute,
  }: {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
  }
) => {
  const options: Intl.DateTimeFormatOptions = {
    year,
    month,
    day,
    hour,
    minute,
  };

  return new Intl.DateTimeFormat('pt-BR', options).format(date);
};

export default treatDate;
