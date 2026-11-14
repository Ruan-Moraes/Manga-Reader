import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hook/usePrefersReducedMotion';

interface AnimatedNumberProps {
    value: string;
    locale: string;
    run: boolean;
}

interface ParsedNumber {
    prefix: string;
    target: number;
    suffix: string;
    hasNumericValue: boolean;
}

export function parseNumberString(value: string): ParsedNumber {
    const match = String(value).match(/^(\D*)([\d.,]+)(.*)$/);
    if (!match) {
        return { prefix: '', target: 0, suffix: '', hasNumericValue: false };
    }
    const prefix = match[1] ?? '';
    const target = Number.parseInt(match[2].replace(/[.,]/g, ''), 10);
    const suffix = match[3] ?? '';
    return { prefix, target, suffix, hasNumericValue: true };
}

export default function AnimatedNumber({
    value,
    locale,
    run,
}: AnimatedNumberProps) {
    const reduceMotion = usePrefersReducedMotion();
    const { prefix, target, suffix, hasNumericValue } =
        parseNumberString(value);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [current, setCurrent] = useState(run ? 0 : target);

    useEffect(() => {
        if (!run || !hasNumericValue || reduceMotion) {
            setCurrent(target);
            if (spanRef.current) {
                spanRef.current.textContent = `${prefix}${target.toLocaleString(locale)}${suffix}`;
            }
            return;
        }

        let frame = 0;
        const duration = 1100;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = Math.round(eased * target);
            if (spanRef.current) {
                spanRef.current.textContent = `${prefix}${val.toLocaleString(locale)}${suffix}`;
            }
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                setCurrent(target);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [hasNumericValue, locale, prefix, reduceMotion, run, suffix, target]);

    if (!hasNumericValue) return <>{value}</>;

    return (
        <span ref={spanRef}>
            {prefix}
            {current.toLocaleString(locale)}
            {suffix}
        </span>
    );
}
