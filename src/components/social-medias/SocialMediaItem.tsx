import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import CustomLinkBase from '../links/elements/CustomLinkBase';

interface ISocialMediaItem {
  color: SOCIAL_MEDIA_COLORS;
  name: string;
  href: string;
}

const SocialMediaItem = ({ color, name, href }: ISocialMediaItem) => {
  return (
    <div
      className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
      style={{ backgroundColor: color }}
    >
      <CustomLinkBase
        href={href}
        text={name}
        otherStyles={{ fontSize: '0.75rem', lineHeight: '1rem' }}
      />
    </div>
  );
};

export default SocialMediaItem;
