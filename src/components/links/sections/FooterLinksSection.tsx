import LinkBox from '../../boxes/LinkBox';
import CustomLinkBase from '../elements/CustomLinkBase';

type FooterLinksSectionProps = {
  className?: string;
  title: string;
  links: { href: string; text: string }[];
};

const FooterLinksSection = ({
  className,
  title,
  links,
}: FooterLinksSectionProps) => {
  return (
    <div {...(className && { className })}>
      <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary">
        <h2 className="text-shadow-highlight">{title}</h2>
      </div>
      <LinkBox>
        {links.map((link, index) => (
          <CustomLinkBase
            href={link.href}
            key={index}
            className={
              index === links.length - 1
                ? 'border-b-0 border-b-tertiary p-2'
                : 'border-b-2 border-b-tertiary p-2'
            }
            text={link.text}
          />
        ))}
      </LinkBox>
    </div>
  );
};

export default FooterLinksSection;
