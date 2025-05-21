type EmojiModalBodyProps = {
  onClick: (emoji: HTMLImageElement) => void;
  onClose: (emoji: HTMLImageElement) => void;
};

// TODO: Fazer chamada para a API de emojis
const EmojiModalBody = ({ onClick, onClose }: EmojiModalBodyProps) => {
  const emojis = Array.from({ length: 19 });

  const columns = [];

  for (let i = 0; i < emojis.length; i += 3) {
    columns.push(emojis.slice(i, i + 3));
  }

  return (
    <div className="overflow-x-auto max-w-full scrollbar-hidden">
      <div className="flex gap-2  w-max">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 flex-shrink-0">
            {col.map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="w-[124px] h-[124px] border border-tertiary rounded-xs shadow-lg overflow-hidden"
              >
                <img
                  src={`https://fakeimg.pl/124x124?text=Emoji_${
                    colIndex * 3 + rowIndex
                  }`}
                  alt="Emoji"
                  onClick={(e: React.MouseEvent<HTMLImageElement>) => {
                    if () {
                    onClick(e.currentTarget);

                    }

                    if () {
                      onClose(e.currentTarget);
                    }

                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiModalBody;
