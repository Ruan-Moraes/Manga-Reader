import { useLocation } from 'react-router-dom';

const Categories = () => {
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('q');

  return (
    <div>
      <h1>Resultados para: {query}</h1>

      {/* Exemplo de uso de parâmetros de consulta */}
      {query === 'latest' && <p>Últimos lançamentos</p>}
    </div>
  );
};

export default Categories;
