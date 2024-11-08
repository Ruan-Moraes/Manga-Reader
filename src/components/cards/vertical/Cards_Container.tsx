import Card from './Card';

import Section_Title from '../../titles/Section_Title';
import ButtonHighLight from '../../buttons/ButtonHighLight';

interface ICards_Container {
  title: string;
  sub: string;
}

const Cards_Container = ({ title, sub }: ICards_Container) => {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <Section_Title title={title} sub={sub} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card
          type="Manhwa"
          title="The Beginning After The End"
          imageSrc="https://cdn.myanimelist.net/images/anime/1883/146143l.jpg"
          chapters="100 99 98,5"
          releaseDate="07/09"
        />
        <Card
          type="Manga"
          title="Shingeki no Kyojin"
          imageSrc="https://images8.alphacoders.com/108/1081458.jpg"
          chapters="139 138 137"
          releaseDate="06/09"
        />
        <Card
          type="Manga"
          title="Naruto Clássico"
          imageSrc="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
          chapters="700 699 698"
          releaseDate="05/09"
        />
        <Card
          type="Manhwa"
          title="Solo Leveling"
          imageSrc="https://images.alphacoders.com/135/1359819.jpeg"
          chapters="155 154 153"
          releaseDate="04/09"
        />
        <Card
          type="Manga"
          title="Fukushuu o Koinegau Saikyou Yuusha wa  Yami no Chikara de Senmetsu Musou Suru"
          imageSrc="https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png"
          chapters="10 9 8"
          releaseDate="03/09"
        />
        <Card
          type="Manhwa"
          title="Tower of god"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/257841l.jpg"
          chapters="500 499 498"
          releaseDate="02/09"
        />
        <Card
          type="Manhua"
          title="Tales of Demons and Gods"
          imageSrc="https://cdn.myanimelist.net/images/anime/7/85886l.jpg"
          chapters="300 299 298"
          releaseDate="01/09"
        />
        <Card
          type="Manhua"
          title="The God of High School"
          imageSrc="https://cdn.myanimelist.net/images/manga/1/205814l.jpg?_gl=1*l6k1h6*_gcl_au*MTQxNzU4NDYwMy4xNzMwNTgyMjEy*_ga*NzQ0MDI0MjM3LjE3MzA1ODIyMDU.*_ga_26FEP9527K*MTczMDU4MjIxMS4xLjEuMTczMDU4MjYyNy41OS4wLjA."
          chapters="500 499 498"
          releaseDate="29/08"
        />
        <Card
          type="Manga"
          title="One Piece"
          imageSrc="https://cdn.myanimelist.net/images/anime/1460/110427l.jpg"
          chapters="1000 999 998"
          releaseDate="28/08"
        />
        <Card
          type="Manga"
          title="Blue Lock"
          imageSrc="https://cdn.myanimelist.net/images/anime/1358/143377l.jpg"
          chapters="50 49 48"
          releaseDate="27/08"
        />
      </div>
      <div>
        <ButtonHighLight text="Ver Mais" />
      </div>
    </section>
  );
};

export default Cards_Container;
