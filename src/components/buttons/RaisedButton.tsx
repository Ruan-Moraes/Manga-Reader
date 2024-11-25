interface IRaisedButton {
  text: string;
}

const RaisedButton = ({ text }: IRaisedButton) => {
  return (
    <button className="w-full p-2 font-bold transition duration-500 border rounded-sm shadow-elevated border-tertiary text-shadow-highlight hover:shadow-none outline-1 outline-transparent outline hover:outline-tertiary hover:font-extrabold">
      {text}
    </button>
  );
};

export default RaisedButton;
