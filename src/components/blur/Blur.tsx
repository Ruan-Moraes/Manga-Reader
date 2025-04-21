import { useEffect } from 'react';

type BlurTypes = {
  isOpen: boolean;
  onClickBlur: React.Dispatch<React.SetStateAction<boolean>>;
};

const Blur = ({ isOpen, onClickBlur }: BlurTypes) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    if (!isOpen) {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleBlur = () => {
    onClickBlur(false);
  };

  return (
    <div
      className={`fixed z-20 top-0 bottom-0 left-0 right-0 backdrop-blur-xs ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBlur}
      style={{
        transition: 'opacity 300ms',
      }}
    ></div>
  );
};

export default Blur;
