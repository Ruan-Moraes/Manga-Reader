import Slash from './SlashBreadCrumb';
import ItemBreadCrumb from './ItemBreadCrumb';

const BreadCrump = () => {
  return (
    <div className="flex px-2 py-1 overflow-x-scroll border-b-2 break-keep whitespace-nowrap border-b-tertiary">
      <ItemBreadCrumb text="Home" href="#" />
      <Slash />
      <ItemBreadCrumb text="Categorias" href="#" />
      <Slash />
      <ItemBreadCrumb text="Mangas" href="#" />
      <Slash />
      <ItemBreadCrumb text="Ação" href="#" />
      <Slash />
      <ItemBreadCrumb
        text="The Beginning After The End"
        href="#"
        isCurrentPage={true}
      />
    </div>
  );
};

export default BreadCrump;
