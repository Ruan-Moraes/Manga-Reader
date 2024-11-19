import { MdMenu } from 'react-icons/md';

interface IMenu {
  disabledBreadcrumb?: boolean;
}

const Menu = ({ disabledBreadcrumb }: IMenu) => {
  return (
    <nav
      className={`flex flex-row-reverse p-2 border-b-2 border-b-tertiary ${
        !disabledBreadcrumb ? 'bg-primary-default' : 'bg-secondary'
      }`}
    >
      <MdMenu className="text-4xl" color="#0000ff" />
    </nav>
  );
};

export default Menu;
