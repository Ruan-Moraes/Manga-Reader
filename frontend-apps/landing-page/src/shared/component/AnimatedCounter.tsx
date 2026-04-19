import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AnimatedCounterProps {
    target: number;
    duration?: number;
    suffix?: string;
    className?: string;
}

export default function AnimatedCounter({
    target,
    duration = 2000,
    suffix = '',
    className,
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);

    const { i18n } = useTranslation();

    const rafRef = useRef<number | null>(null);

    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) return;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;

            const elapsed = timestamp - startTimeRef.current;

            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(eased * target));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return (
        <span className={className} role="status" aria-live="polite">
            {count.toLocaleString(i18n.language)}
            {suffix}
        </span>
    );
}
