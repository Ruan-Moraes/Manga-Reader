const Body = ({
  Warning,
  Carousel,
  HighlightCards,
}: // HorizontalCards,
{
  Warning: React.FC;
  Carousel: React.FC;
  HighlightCards: React.FC;
  // HorizontalCards: React.FC;
}) => {
  return (
    <main className="flex flex-col gap-8 p-4 py-8 bg-primary-default">
      <Warning />
      <Carousel />
      <HighlightCards />
      {/* <HorizontalCards /> */}
      {/* <VerticalCards /> */}
    </main>
  );
};

export default Body;
