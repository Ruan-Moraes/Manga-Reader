type ISocialMediasContainer = {};

const SocialMediasContainer = ({}: ISocialMediasContainer) => {
  return (
    <aside className="flex flex-col">
      <div>
        <h2 className="p-2 text-sm font-bold text-center rounded-t-sm bg-tertiary text-shadow-default">
          Fique por dentro das nossas redes sociais
        </h2>
      </div>
      <div className="grid grid-cols-2 text-center rounded-b-sm">
        <div
          className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
          style={{ backgroundColor: '#7289DA' }}
        >
          <a href="#" className="text-xs font-bold">
            Discord
          </a>
        </div>
        <div
          className="flex items-center justify-center p-2 border border-tertiary text-shadow-highlight"
          style={{ backgroundColor: '#14171A' }}
        >
          <a href="#" className="text-xs font-bold">
            X (Twitter)
          </a>
        </div>
        <div
          className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
          style={{ backgroundColor: '#4267B2' }}
        >
          <a href="#" className="text-xs font-bold">
            Facebook
          </a>
        </div>
        <div
          className="flex items-center justify-center p-2 border border-tertiary text-shadow-default"
          style={{ backgroundColor: '#E1306C' }}
        >
          <a href="#" className="text-xs font-bold">
            Instagram
          </a>
        </div>
      </div>
    </aside>
  );
};

export default SocialMediasContainer;
