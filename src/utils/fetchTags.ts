const tags = async () => {
  try {
    const response = await fetch('http://localhost:5000/tags');

    if (!response.ok) {
      throw new Error('Ocorreu um erro ao buscar as tags');
    }

    const data: { id: number; name: string }[] = await response.json();

    return data.map((tag) => {
      return {
        value: tag.id,
        label: tag.name,
      };
    });
  } catch (error) {
    console.error(error);
  }
};

export default await tags();
