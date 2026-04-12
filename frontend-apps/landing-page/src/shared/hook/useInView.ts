import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export default function useInView({
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
}: UseInViewOptions = {}) {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    if (triggerOnce) observer.unobserve(element);
                } else if (!triggerOnce) {
                    setInView(false);
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, inView };
}
