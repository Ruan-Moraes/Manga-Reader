import { useParams } from 'react-router-dom';

const Title = () => {
  const { title } = useParams<{ title: string }>();

  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};

export default Title;
