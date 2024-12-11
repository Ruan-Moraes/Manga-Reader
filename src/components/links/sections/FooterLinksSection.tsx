import LinkBox from '../../boxes/LinkBox';
import CustomLinkWithBorder from '../elements/CustomLinkWithBorder';

type FooterLinksSectionProps = {
  title: string;
  links: { href: string; text: string }[];
  classNames?: string;
};

const FooterLinksSection = ({
  title,
  links,
  classNames,
}: FooterLinksSectionProps) => {
  return (
    <div className={classNames || ''}>
      <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary">
        <h2 className="text-shadow-highlight">{title}</h2>
      </div>
      <LinkBox>
        {links.map((link, index) => (
          <CustomLinkWithBorder
            key={index}
            href={link.href}
            text={link.text}
            otherStyles={
              index === links.length - 1 ? { borderBottom: 'none' } : {}
            }
          />
        ))}
      </LinkBox>
    </div>
  );
};

export default FooterLinksSection;
