type TextBlockTypes = {
    title?: string;
    paragraphContent: { text: string }[];
};

const TextBlock = ({ title, paragraphContent }: TextBlockTypes) => {
    return (
        <div className={title ? 'flex flex-col gap-2' : ''}>
            {title && (
                <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                </div>
            )}
            <div className="flex flex-col gap-2 text-xs text-justify">
                {paragraphContent.map((item, index) => (
                    <div key={index}>
                        <p>{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TextBlock;
