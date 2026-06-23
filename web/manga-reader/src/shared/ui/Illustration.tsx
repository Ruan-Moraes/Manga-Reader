import React from 'react';

import { illustrationUrl, type IllustrationName } from '@shared/lib/illustrations';

export type IllustrationType = IllustrationName;

interface IllustrationProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: IllustrationType;
}

const Illustration: React.FC<IllustrationProps> = ({ type, alt = '', ...props }) => {
    return <img src={illustrationUrl(type)} alt={alt || type} loading="lazy" {...props} />;
};

export default Illustration;
