import { Children, useRef } from 'react';

import clsx from 'clsx';

import Section_Title from '../../titles/SectionTitle';
import ButtonHighLight from '../../buttons/RaisedButton';

interface ICardsContainer {
  title: string;
  sub: string;
  children: React.ReactNode;
}

const CardsContainer = ({ title, sub, children }: ICardsContainer) => {
  const allChildren = Children.toArray(children) as React.ReactElement[];

  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Section_Title title={title} sub={sub} />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-4">
          {allChildren.slice(0, 10).map((child) => (
            <div key={child.key}>{child}</div>
          ))}
        </div>
        <div className={clsx('grid-cols-2 gap-4')}>
          {allChildren.slice(10, 20).map((child) => (
            <div key={child.key}>{child}</div>
          ))}
        </div>
        <div className={clsx('grid-cols-2 gap-4')}>
          {allChildren.slice(20, 30).map((child) => (
            <div key={child.key}>{child}</div>
          ))}
        </div>
      </div>
      <div>
        <ButtonHighLight text="Ver Mais" ref={buttonRef} />
      </div>
    </section>
  );
};

export default CardsContainer;
