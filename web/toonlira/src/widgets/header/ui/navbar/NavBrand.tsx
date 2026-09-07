type Props = {
    onNavigate: (path: string) => void;
};

const NavBrand = ({ onNavigate }: Props) => (
    <button
        type="button"
        onClick={() => onNavigate('/')}
        aria-label={`${brand.name}, ir para home`}
        className="shrink-0 font-ui-sans font-ui-extrabold italic tracking-ui-logo text-ui-fg"
    >
        {brand.name}
    </button>
);

export default NavBrand;
import { brand } from '@toonlira/brand';
