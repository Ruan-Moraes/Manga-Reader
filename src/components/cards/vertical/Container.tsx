import Section_Title from '../../titles/Section_Title';

const Cards_Container = ({ title, sub }: { title: string; sub: string }) => {
  return (
    <div>
      <div>
        <Section_Title title={title} sub={sub} />
      </div>
      <div></div>
    </div>
  );
};

export default Cards_Container;
