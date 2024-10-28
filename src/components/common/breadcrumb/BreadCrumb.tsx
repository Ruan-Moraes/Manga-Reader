import Slash from './Slash';
import Item from './Item';

const BreadCrump = () => {
  return (
    <div className="flex px-2 py-1 overflow-x-scroll border-b-2 break-keep whitespace-nowrap border-b-tertiary">
      <Item text="Home" href="#" />
      <Slash />
      <Item text="Categorias" href="#" />
      <Slash />
      <Item text="Manhwas" href="#" />
      <Slash />
      <Item text="Ação" href="#" />
      <Slash />
      <Item text="The Beginning After The End" href="#" isCurrentPage={true} />
    </div>
  );
};

export default BreadCrump;
