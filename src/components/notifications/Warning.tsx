const Warning = ({
  title,
  message,
  color,
  link,
  linkText,
}: {
  title: string;
  message: string;
  color: 'quaternary' | 'quinary';
  link?: string;
  linkText?: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-sm border-${color}-default`}
      >
        <div>
          <h2>
            <span className={`text-xl font-bold text-${color}-default`}>
              {title}
            </span>
          </h2>
        </div>
        <div className="text-xs">
          <p>{message}</p>
        </div>
      </div>
      {link && (
        <div>
          <a
            href={link}
            className={`text-sm font-bold text-${color}-default hover:text-${color}-normal`}
          >
            {linkText}
          </a>
        </div>
      )}
    </div>
  );
};

export default Warning;