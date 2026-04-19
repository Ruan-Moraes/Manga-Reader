type SocialMediaSectionTypes = {
    children: React.ReactNode;
};

const SocialMediaSection = ({ children }: SocialMediaSectionTypes) => {
    return (
        <div>
            <div className="p-2 rounded-t-xs bg-tertiary">
                <h2 className="text-sm font-bold text-center text-shadow-default">
                    Fique por dentro das nossas redes sociais
                </h2>
            </div>
            <div className="grid grid-cols-2 text-center rounded-b-xs">
                {children}
            </div>
        </div>
    );
};

export default SocialMediaSection;
