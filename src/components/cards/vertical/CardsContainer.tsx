import { useState, Children } from 'react';
import { useNavigate } from 'react-router-dom';

import Section_Title from '../../titles/SectionTitle';
import ButtonHighLight from '../../buttons/RaisedButton';

interface ICardsContainer {
  title: string;
  sub: string;
  children: React.ReactNode;
}

const CardsContainer = ({ title, sub, children }: ICardsContainer) => {
  const [visible, setVisible] = useState(10);

  const allChildren = Children.toArray(children) as React.ReactElement[];
  const navigate = useNavigate();

  const handleClick = () => {
    if (visible >= allChildren.length) {
      navigate('/Manga-Reader/categories?q=latest');
    } else {
      setVisible((prev) => prev + 10);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Section_Title title={title} sub={sub} />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-4">
          {allChildren.slice(0, visible)}
        </div>
      </div>
      <div>
        <ButtonHighLight text="Ver Mais" callBack={handleClick} />
      </div>
    </section>
  );
};

export default CardsContainer;
