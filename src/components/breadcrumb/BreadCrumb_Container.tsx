import Item from './BreadCrumb_Item';

const BreadCrumb_Container = () => {
  return (
    <ul className="flex px-2 py-1 overflow-x-scroll border-b-2 break-keep whitespace-nowrap border-b-tertiary">
      <Item text="Home" href="#" />
      <Item text="Categorias" href="#" />
      <Item text="Manhwas" href="#" />
      <Item text="Ação" href="#" />
      <Item text="The Beginning After The End" href="#" isCurrentPage={true} />
    </ul>
  );
};

export default BreadCrumb_Container;
