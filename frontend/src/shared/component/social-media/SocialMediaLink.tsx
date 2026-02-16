import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import AppLink from '@shared/component/link/element/AppLink';

type SocialMediaLinkTypes = {
    className?: string;
    color: SOCIAL_MEDIA_COLORS;
    link: string;
    name: string;
};

const SocialMediaLink = ({
    className,
    color,
    link,
    name,
}: SocialMediaLinkTypes) => {
    return (
        <div
            className={`flex items-center justify-center p-2 border border-tertiary text-shadow-default ${className}`}
            style={{ backgroundColor: color }}
        >
            <AppLink className="text-xs leading-none" link={link} text={name} />
        </div>
    );
};

export default SocialMediaLink;
