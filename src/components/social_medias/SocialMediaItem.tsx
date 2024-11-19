import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

interface ISocialMediaItem {
  color: SOCIAL_MEDIA_COLORS;
  name: string;
  link: string;
}

const SocialMediaItem = ({ color, name, link }: ISocialMediaItem) => {
  return (
    <div
      className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
      style={{ backgroundColor: color }}
    >
      <a href={link} className="text-xs font-bold">
        {name}
      </a>
    </div>
  );
};

export default SocialMediaItem;
