const SkeletonCard = () => {
  return (
    <div className="flex flex-col items-start">
      <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">...</span>
      </div>
      <div className="flex flex-col w-full border rounded-sm rounded-tl-none border-tertiary">
        <div className="flex items-center justify-center h-[11.625rem]">
          <p className="font-bold text-tertiary">Carregando...</p>
        </div>
        <div className="border-t border-t-tertiary">
          <div className="px-2 py-0.5 text-sm font-bold text-center bg-tertiary">
            <h3 className="text-shadow-default">Carregando...</h3>
          </div>
          <div className="flex flex-col px-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <p
                key={index}
                className={`flex items-center justify-between p-1 text-xs py-2 ${
                  index < 2 ? 'border-b border-tertiary' : ''
                }`}
              >
                <span>Capítulo:</span>
                <span className="flex items-center gap-2">
                  {index === 0 ? (
                    <span className="p-0.5 px-1 text-[0.5rem] rounded-sm bg-tertiary">
                      ...
                    </span>
                  ) : (
                    ''
                  )}
                  <span className="font-bold text-tertiary">...</span>
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
