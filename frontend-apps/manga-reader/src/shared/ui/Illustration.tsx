import React from 'react';

export type IllustrationType = '404' | 'duvida' | 'feliz' | 'pensando' | 'surpresa' | 'triste' | 'zangada';

interface IllustrationProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: IllustrationType;
}

const Illustration: React.FC<IllustrationProps> = ({ type, alt = '', ...props }) => {
    return <img src={`/illustrations/${type}.png`} alt={alt || type} loading="lazy" {...props} />;
};

export default Illustration;
