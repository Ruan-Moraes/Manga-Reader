import { useEffect } from 'react';

type BlurProps = {
  isOpen: boolean;
  onChange: React.Dispatch<React.SetStateAction<boolean>>;
};

const Blur = ({ isOpen, onChange }: BlurProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleBlur = () => {
    onChange(false);
  };

  return (
    <div
      className={`fixed z-10 top-0 bottom-0 left-0 right-0 backdrop-blur-sm ${
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
