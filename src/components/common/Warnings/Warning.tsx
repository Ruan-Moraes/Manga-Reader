import icon from '../../../assets/icons/warning.svg';

const Warning = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center border-2 rounded-sm border-quaternary-normal">
      <div className="w-8">
        <img src={icon} alt="warning" />
      </div>
      <div className="text-xs">
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iste
          similique a laborum, vitae{' '}
          <span className="font-bold text-quaternary-normal">molestiae</span>{' '}
          mnis sequi animi consequatur fugit aspernatur porro laudantium quasi
          corrupti fugiat alias ad sit?{' '}
          <span className="font-bold text-quaternary-normal">voluptatum</span>
        </p>
      </div>
    </div>
  );
};

export default Warning;
