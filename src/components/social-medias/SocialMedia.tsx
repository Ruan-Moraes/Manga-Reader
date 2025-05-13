import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import CustomLink from '../links/elements/CustomLink';

type SocialMediaTypes = {
  className?: string;
  color: SOCIAL_MEDIA_COLORS;
  link: string;
  name: string;
};

const SocialMedia = ({ className, color, link, name }: SocialMediaTypes) => {
  return (
    <div
      className={`flex items-center justify-center p-2 border border-tertiary text-shadow-default ${className}`}
      style={{ backgroundColor: color }}
    >
      <CustomLink className="text-xs leading-none" link={link} text={name} />
    </div>
  );
};

export default SocialMedia;
