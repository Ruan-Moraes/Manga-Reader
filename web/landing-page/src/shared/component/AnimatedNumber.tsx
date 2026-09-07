import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
    value: string;
    locale: string;
    run: boolean;
}

export default function AnimatedNumber({
    value,
    locale,
    run,
}: AnimatedNumberProps) {
    const match = String(value).match(/^(\D*)([\d.,]+)(.*)$/);
    const hasNumericValue = Boolean(match);
    const prefix = match?.[1] ?? '';
    const target = match
        ? Number.parseInt(match[2].replace(/[.,]/g, ''), 10)
        : 0;
    const suffix = match?.[3] ?? '';
    const [current, setCurrent] = useState(run ? 0 : target);

    useEffect(() => {
        const reduceMotion =
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
            false;

        if (!run || !hasNumericValue || reduceMotion) {
            setCurrent(target);
            return;
        }

        let frame = 0;
        const duration = 1100;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * target));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [hasNumericValue, run, target]);

    if (!match) return <>{value}</>;

    return (
        <>
            {prefix}
            {current.toLocaleString(locale)}
            {suffix}
        </>
    );
}
