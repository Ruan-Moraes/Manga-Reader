import { useEffect } from 'react';

interface IBlur {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Blur = ({ open, setOpen }: IBlur) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const handleBlur = () => {
    setOpen(false);
  };

  return (
    <div
      onClick={handleBlur}
      style={{
        transition: 'opacity 500ms',
      }}
      className={`fixed z-10 top-0 bottom-0 left-0 right-0 backdrop-blur-sm ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    ></div>
  );
};

export default Blur;
