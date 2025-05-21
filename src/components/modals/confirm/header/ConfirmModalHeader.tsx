type ConfirmModalHeaderProps = {
  title: string;
};

const ConfirmModalHeader = ({ title }: ConfirmModalHeaderProps) => {
  return (
    <div>
      <h2 className="text-lg font-bold leading-none text-center text-quinary-default">
        {title}
      </h2>
    </div>
  );
};

export default ConfirmModalHeader;
