type TextBlockTypes = {
    paragraphContent: { text: string }[];
};

const TextBlock = ({ paragraphContent }: TextBlockTypes) => {
    return (
        <div>
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
