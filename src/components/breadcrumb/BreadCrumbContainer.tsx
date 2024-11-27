import Item from './BreadCrumbItem';

const BreadCrumbContainer = () => {
  return (
    <nav className="flex p-2 overflow-x-scroll text-xs border-b-2 break-keep whitespace-nowrap border-b-tertiary">
      <Item text="Home" href="/" />
      <Item text="Categorias" href="#" />
      <Item text="Manhwas" href="#" />
      <Item text="Ação" href="#" />
      <Item text="The Beginning After The End" href="#" isCurrentPage={true} />
    </nav>
  );
};

export default BreadCrumbContainer;
