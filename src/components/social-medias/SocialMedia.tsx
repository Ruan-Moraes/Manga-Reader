import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import CustomLink from '../links/elements/CustomLink';

type SocialMediaTypes = {
  className?: string;
  color: SOCIAL_MEDIA_COLORS;
  href: string;
  name: string;
};

const SocialMedia = ({ className, color, href, name }: SocialMediaTypes) => {
  return (
    <div
      className={`flex items-center justify-center p-2 border border-tertiary text-shadow-default ${className}`}
      style={{ backgroundColor: color }}
    >
      <CustomLink className="text-xs leading-none" href={href} text={name} />
    </div>
  );
};

export default SocialMedia;
