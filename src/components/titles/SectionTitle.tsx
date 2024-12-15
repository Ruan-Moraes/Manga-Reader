import CustomLinkBase from '../links/elements/CustomLinkBase';

type SectionTitleProps = {
  children?: React.ReactNode;
  titleStyleClasses?: string;
  title: string;
  subTitle?: string;
  subLink?: string;
};

const SectionTitle = ({
  children,
  titleStyleClasses,
  title,
  subTitle,
  subLink,
}: SectionTitleProps) => {
  return (
    <div className={children ? 'flex flex-col gap-2' : 'flex flex-col'}>
      <div>
        <div>
          <h2
            className={`font-bold ${
              titleStyleClasses ? titleStyleClasses : 'text-2xl'
            }`}
          >
            {title}
          </h2>
        </div>
        <div>
          {subTitle && !subLink && (
            <p className="text-xs text-quaternary-default">{subTitle}</p>
          )}
          {subTitle && subLink && (
            <p className="text-xs text-quaternary-default">
              <CustomLinkBase href={subLink} text={subTitle} />
            </p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionTitle;
