import Section_Title from '../../titles/SectionTitle';
import Card from './Card';

interface ICardsContainer {
  title: string;
  sub: string;
}

const CardsContainer = ({ title, sub }: ICardsContainer) => {
  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex gap-4 overflow-x-auto flex-nowrap">
        <Card
          type="Manga"
          chapters="1600"
          imageSrc="https://cdn.myanimelist.net/images/anime/1460/110427l.jpg"
          title="One Piece"
        />
        <Card
          type="Manhwa"
          chapters="180"
          imageSrc="https://images.alphacoders.com/135/1359819.jpeg"
          title="Solo Leveling"
        />
        <Card
          type="Manhua"
          chapters="400"
          imageSrc="https://cdn.myanimelist.net/images/anime/7/85886l.jpg"
          title="Tales of Demons and Gods"
        />
        <Card
          type="Manga"
          chapters="139"
          imageSrc="https://images8.alphacoders.com/108/1081458.jpg"
          title="Shingeki no Kyojin"
        />
        <Card
          type="Manhwa"
          chapters="200"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/257841l.jpg"
          title="Tower of God"
        />
        <Card
          type="Manhua"
          chapters="300"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/205814l.jpg?_gl=1*l6k1h6*_gcl_au*MTQxNzU4NDYwMy4xNzMwNTgyMjEy*_ga*NzQ0MDI0MjM3LjE3MzA1ODIyMDU.*_ga_26FEP9527K*MTczMDU4MjIxMS4xLjEuMTczMDU4MjYyNy41OS4wLjA."
          title="The God of High School"
        />
        <Card
          type="Manga"
          chapters="1000"
          imageSrc="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
          title="Naruto Clássico"
        />
        <Card
          type="Manhwa"
          chapters="150"
          imageSrc="https://cdn.myanimelist.net/images/anime/1883/146143l.jpg"
          title="The Beginning After the End"
        />
        <Card
          type="Manga"
          chapters="50"
          imageSrc="https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png"
          title="Fukushuu o Koinegau Saikyou Yuusha wa, Yami no Chikara de Senmetsu Musou Suru"
        />
        <Card
          type="Manga"
          chapters="800"
          imageSrc="https://cdn.myanimelist.net/images/manga/3/180022l.jpg"
          title="Bleach"
        />
      </div>
    </section>
  );
};

export default CardsContainer;
