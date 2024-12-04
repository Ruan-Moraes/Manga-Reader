const SkeletonCard = () => {
  return (
    <div className="flex flex-col items-start">
      <div className="px-3 py-1 rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">...</span>
      </div>
      <div className="flex flex-row items-center w-full gap-4">
        <div className="flex flex-col w-2/4 border rounded-sm rounded-tl-none border-tertiary">
          <div className="flex items-center justify-center h-52">
            <p className="font-bold text-center text-tertiary">Carregando...</p>
          </div>
          <div className="border-t border-t-tertiary">
            <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
              <h3 className="truncate text-shadow-default">...</h3>
            </div>
            <div className="flex flex-col w-full gap-1 p-2 text-xs">
              <div>
                <p className="truncate">
                  <span className="font-bold">Popularidade:</span>{' '}
                  <span className="text-tertiary">... º</span>
                </p>
              </div>
              <div>
                <p>
                  <span className="font-bold">Nota:</span>{' '}
                  <span className="text-tertiary">...</span>
                </p>
              </div>
              <div>
                <p>
                  <span className="font-bold">Capítulos:</span>{' '}
                  <span className="text-tertiary">...</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Autor:</span>{' '}
                  <span className="text-tertiary">...</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Artista:</span>{' '}
                  <span className="text-tertiary">...</span>
                </p>
              </div>
              <div>
                <p className="truncate">
                  <span className="font-bold">Editora:</span>{' '}
                  <span className="text-tertiary">...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-2/4 overflow-hidden">
          <p className="text-center text-tertiary">Carregando...</p>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
