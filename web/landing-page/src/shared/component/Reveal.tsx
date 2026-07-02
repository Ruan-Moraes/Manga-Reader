import {
    createElement,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ElementType,
    type ReactNode,
} from 'react';

interface RevealProps {
    children: ReactNode;
    delay?: number;
    y?: number;
    as?: ElementType;
    style?: CSSProperties;
    className?: string;
}

/**
 * Wrapper de entrada (fade + slide) ao entrar na viewport.
 * Elementos acima da dobra aparecem imediatamente; respeita prefers-reduced-motion.
 */
export default function Reveal({
    children,
    delay = 0,
    y = 18,
    as = 'div',
    style,
    className,
}: RevealProps) {
    const ref = useRef<HTMLElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;

        if (!el) return;

        const reduce =
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduce) {
            setShown(true);
            return;
        }

        const vh = window.innerHeight || 800;

        if (el.getBoundingClientRect().top < vh * 0.92) {
            setShown(true);
            return;
        }

        if (!('IntersectionObserver' in window)) {
            setShown(true);
            return;
        }

        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setShown(true);
                        io.disconnect();
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );

        io.observe(el);

        return () => io.disconnect();
    }, []);

    return createElement(
        as,
        {
            ref,
            className,
            style: {
                ...style,
                opacity: shown ? 1 : 0,
                transform: shown ? 'none' : `translateY(${y}px)`,
                transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
                willChange: 'opacity, transform',
            },
        },
        children,
    );
}
