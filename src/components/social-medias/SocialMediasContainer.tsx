type SocialMediasContainerProps = {
  children: React.ReactNode;
};

const SocialMediasContainer = ({ children }: SocialMediasContainerProps) => {
  return (
    <div>
      <div className="p-2 rounded-t-sm bg-tertiary">
        <h2 className="text-sm font-bold text-center text-shadow-default">
          Fique por dentro das nossas redes sociais
        </h2>
      </div>
      <div className="grid grid-cols-2 text-center rounded-b-sm">
        {children}
      </div>
    </div>
  );
};

export default SocialMediasContainer;
