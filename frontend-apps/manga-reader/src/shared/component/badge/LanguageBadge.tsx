import { type FC } from 'react';

type Props = {
    language?: string;
};

const COLORS: Record<string, string> = {
    'pt-BR': 'bg-green-500/20 text-green-300',
    'en-US': 'bg-blue-500/20 text-blue-300',
    'es-ES': 'bg-yellow-500/20 text-yellow-300',
};

/**
 * Renderiza tag visual do idioma de um post UGC. Usado em moderação
 * cross-language admin para indicar de onde veio cada item misturado.
 * Renderiza nada se language não informado.
 */
const LanguageBadge: FC<Props> = ({ language }) => {
    if (!language) return null;
    const cls = COLORS[language] ?? 'bg-tertiary/30 text-tertiary';
    return (
        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono rounded-xs ${cls}`} title={`Posted in ${language}`}>
            {language}
        </span>
    );
};

export default LanguageBadge;
