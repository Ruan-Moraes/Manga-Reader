import React, { useCallback, useRef } from 'react';

import CustomLink from '../links/elements/CustomLink';

type LinkBoxTypes = {
  children: React.ReactElement;
  className?: string;
};

const LinkBox = ({ children, className }: LinkBoxTypes) => {
  const childRef = useRef<HTMLAnchorElement>(null);

  const handleClick = useCallback(() => {
    if (childRef.current) {
      childRef.current.click();
    }
  }, []);

  if (children.type !== CustomLink) {
    throw new Error('LinkBox children must be of type CustomLink');
  }

  return (
    <div
      onClick={handleClick}
      className={`text-center flex items-center justify-center relative h-10 duration-300 border rounded-xs bg-secondary border-tertiary hover:bg-quaternary-opacity-25 ${className}`}
    >
      {React.cloneElement(children, { ref: childRef })}
    </div>
  );
};

export default LinkBox;
