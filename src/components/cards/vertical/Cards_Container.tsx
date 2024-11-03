import Section_Title from '../../titles/Section_Title';
import Card from './Card';

const Cards_Container = ({ title, sub }: { title: string; sub: string }) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Section_Title title={title} sub={sub} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card
          type="Manhwa"
          title="The Beginning After The End"
          imageSrc="https://cdn.myanimelist.net/images/anime/1883/146143l.jpg"
        />
        <Card
          type="Manga"
          title="Shingeki no Kyojin"
          imageSrc="https://images8.alphacoders.com/108/1081458.jpg"
        />
        <Card
          type="Manga"
          title="Naruto Clássico"
          imageSrc="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
        />
        <Card
          type="Manhwa"
          title="Solo Leveling"
          imageSrc="https://images.alphacoders.com/135/1359819.jpeg"
        />
        <Card
          type="Manga"
          title="Fukushuu o Koinegau Saikyou Yuusha wa, Yami no Chikara de Senmetsu Musou Suru"
          imageSrc="https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png"
        />
        <Card
          type="Manhwa"
          title="Tower of god"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/257841l.jpg"
        />
        <Card
          type="Manhua"
          title="Tales of Demons and Gods"
          imageSrc="https://cdn.myanimelist.net/images/anime/7/85886l.jpg"
        />
        <Card
          type="Manhua"
          title="The God of High School"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/205814l.jpg?_gl=1*l6k1h6*_gcl_au*MTQxNzU4NDYwMy4xNzMwNTgyMjEy*_ga*NzQ0MDI0MjM3LjE3MzA1ODIyMDU.*_ga_26FEP9527K*MTczMDU4MjIxMS4xLjEuMTczMDU4MjYyNy41OS4wLjA."
        />
        <Card
          type="Manga"
          title="One Piece"
          imageSrc="https://cdn.myanimelist.net/images/anime/1460/110427l.jpg"
        />
        <Card
          type="Manga"
          title="Blue Lock"
          imageSrc="https://cdn.myanimelist.net/images/anime/1358/143377l.jpg"
        />
      </div>
    </div>
  );
};

export default Cards_Container;
