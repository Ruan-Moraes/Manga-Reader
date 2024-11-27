import Section_Title from '../../titles/SectionTitle';

interface ICardsContainer {
  title: string;
  sub: string;
  children: React.ReactNode;
}

const CardsContainer = ({ title, sub, children }: ICardsContainer) => {
  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex gap-4 overflow-x-auto flex-nowrap">{children}</div>
    </section>
  );
};

export default CardsContainer;
