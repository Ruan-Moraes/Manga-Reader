interface IRaisedButton {
  text: string;
}

const RaisedButton = ({ text }: IRaisedButton) => {
  return (
    <button className="w-full p-2 font-bold transition duration-300 ease-in-out border rounded-sm shadow-elevated border-tertiary text-shadow-highlight hover:shadow-none">
      {text}
    </button>
  );
};

export default RaisedButton;
