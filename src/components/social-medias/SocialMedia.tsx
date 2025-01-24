import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import CustomLinkBase from '../links/elements/CustomLinkBase';

type SocialMediaTypes = {
  color: SOCIAL_MEDIA_COLORS;
  href: string;
  name: string;
};

const SocialMedia = ({ color, href, name }: SocialMediaTypes) => {
  return (
    <div
      className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
      style={{ backgroundColor: color }}
    >
      <CustomLinkBase className="text-xs" href={href} text={name} />
    </div>
  );
};

export default SocialMedia;
