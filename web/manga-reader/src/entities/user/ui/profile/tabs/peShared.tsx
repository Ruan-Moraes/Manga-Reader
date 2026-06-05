import { type CSSProperties, type ReactNode } from 'react';

/**
 * Estilos fiéis ao handoff `design_handoff_profile_edit_modal/mockup`.
 * Inline para reproduzir o pixel exato (cores/spacing/radii do mockup), sem
 * depender de utilitários que arredondam os valores. Tokens equivalem aos
 * `--mr-*` de `colors_and_type.css`.
 */
export const PE = {
    accent: '#ddda2a',
    danger: '#FF784F',
    fieldBg: '#252526',
    fieldBorder: '#444444',
    cardBg: '#1f1f20',
    cardBorder: '#333333',
    mutedBg: '#1a1a1a',
    tertiary: '#727273',
    hint: '#999999',
    intro: '#cccccc',
    fg: '#ffffff',
} as const;

export const peInput: CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    background: PE.fieldBg,
    color: PE.fg,
    border: `1px solid ${PE.fieldBorder}`,
    borderRadius: 2,
    fontSize: 13,
    fontFamily: 'inherit',
    letterSpacing: '.0625rem',
    boxSizing: 'border-box',
    outline: 'none',
};

export const peIntro: CSSProperties = {
    fontSize: 12,
    color: PE.intro,
    lineHeight: 1.6,
    marginTop: 0,
    marginBottom: 18,
};

export const peSmallBtn = (kind: 'ghost' | 'danger'): CSSProperties => ({
    padding: '6px 10px',
    background: 'transparent',
    color: kind === 'danger' ? PE.danger : PE.fg,
    border: `1px solid ${kind === 'danger' ? PE.danger : PE.tertiary}`,
    borderRadius: 2,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '.0625rem',
});

export const peEyebrow = (color: string): CSSProperties => ({
    fontSize: 11,
    fontWeight: 800,
    color,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: 8,
});

export const PEField = ({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) => (
    <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: PE.accent, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
        {children}
        {hint && <div style={{ fontSize: 11, color: PE.hint, marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </label>
);
