import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import CustomLinkBase from '../links/elements/CustomLinkBase';

type SocialMediaItemProps = {
  color: SOCIAL_MEDIA_COLORS;
  href: string;
  name: string;
};

const SocialMediaItem = ({ color, href, name }: SocialMediaItemProps) => {
  return (
    <div
      className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
      style={{ backgroundColor: color }}
    >
      <CustomLinkBase href={href} text={name} className="text-xs" />
    </div>
  );
};

export default SocialMediaItem;
