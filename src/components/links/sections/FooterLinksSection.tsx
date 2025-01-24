import CustomLinkBase from '../elements/CustomLinkBase';

type FooterLinksSectionTypes = {
  className?: string;
  title: string;
  links: { href: string; text: string }[];
};

const FooterLinksSection = ({
  className,
  title,
  links,
}: FooterLinksSectionTypes) => {
  return (
    <div {...(className && { className })}>
      <div className="p-2 font-bold text-center border-2 rounded-sm rounded-b-none bg-primary-default border-tertiary">
        <h2 className="text-shadow-highlight">{title}</h2>
      </div>
      <div className="flex flex-col px-2 text-sm text-center border-2 border-t-0 rounded-sm rounded-t-none bg-primary-default border-tertiary">
        {links.map((link, index) => (
          <CustomLinkBase
            href={link.href}
            key={index}
            className={`${
              index === links.length - 1
                ? 'border-b-0 border-b-tertiary p-2'
                : 'border-b-2 border-b-tertiary p-2'
            } font-normal`}
            text={link.text}
          />
        ))}
      </div>
    </div>
  );
};

export default FooterLinksSection;
