type TextBlockTypes = {
    title?: string;
    paragraphContent: { text: string }[];
};

const TextBlock = ({ title, paragraphContent }: TextBlockTypes) => {
    return (
        <div>
            {title && <h3 className="text-sm font-semibold mb-1">{title}</h3>}
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
