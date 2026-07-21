export default function BrandWordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const isSmall = size === 'sm';

    return (
        <span
            className={`inline-flex items-center gap-2.5 whitespace-nowrap font-extrabold italic tracking-[0.075em] text-fg ${isSmall ? 'text-[1.125rem]' : 'text-[1.25rem]'}`}
        >
            <img
                src={`${import.meta.env.BASE_URL}favicon-64x64.png`}
                alt=""
                className={`shrink-0 rounded object-contain ${isSmall ? 'size-[25px]' : 'size-[27px]'}`}
            />
            <span>
                Manga <span className="text-accent-fg">Reader</span>
            </span>
        </span>
    );
}
