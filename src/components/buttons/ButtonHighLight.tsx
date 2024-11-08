type Props = {
  text: string;
};

const ButtonHighLight = ({ text }: Props) => {
  return (
    <button className="w-full p-2 font-bold transition duration-300 ease-in-out border rounded-sm border-quaternary-default text-shadow-highlight">
      {text}
    </button>
  );
};

export default ButtonHighLight;
