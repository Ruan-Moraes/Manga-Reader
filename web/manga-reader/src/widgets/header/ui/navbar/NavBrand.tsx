type Props = {
    onNavigate: (path: string) => void;
};

const NavBrand = ({ onNavigate }: Props) => (
    <button
        type="button"
        onClick={() => onNavigate('/')}
        aria-label="Manga Reader, ir para home"
        className="shrink-0 font-mr-sans font-mr-extrabold italic tracking-mr-logo text-mr-fg"
    >
        Manga <span className="text-mr-accent">Reader</span>
    </button>
);

export default NavBrand;
