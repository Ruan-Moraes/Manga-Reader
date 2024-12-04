const SkeletonCard = () => {
  return (
    <div className="flex flex-col items-start flex-shrink-0">
      <div className="flex flex-col px-3 py-1 text-center rounded-sm rounded-b-none bg-tertiary">
        <span className="font-bold">...</span>
        <span className="text-xs">(... Capítulos)</span>
      </div>
      <div className="flex justify-center items-center border border-b-0 border-tertiary w-[20rem] h-[14rem] relative">
        <p className="p-4 font-bold text-center text-tertiary">Carregando...</p>
      </div>
      <div className="w-[20rem] px-2 py-1 rounded-b-sm bg-tertiary">
        <h3 className="font-bold text-center truncate text-shadow-default">
          Carregando...
        </h3>
      </div>
    </div>
  );
};

export default SkeletonCard;
