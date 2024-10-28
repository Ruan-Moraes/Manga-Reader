import SectionTitle from '../../others/SectionTitle';

const HorizontalCards = ({ title, sub }: { title: string; sub: string }) => {
  return (
    <div>
      <div>
        <SectionTitle title={title} sub={sub} />
      </div>
      <div></div>
    </div>
  );
};

export default HorizontalCards;
