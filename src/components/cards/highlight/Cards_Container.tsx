import Section_Title from '../../titles/Section_Title';
import Card from './Card';

const Cards_Container = ({ title, sub }: { title: string; sub: string }) => {
  return (
    <section className="flex flex-col gap-4">
      <Section_Title title={title} sub={sub} />
      <div className="flex flex-col gap-4">
        <Card
          type="Manhwa"
          title="Solo Leveling"
          imageSrc="https://images.alphacoders.com/135/1359819.jpeg"
          popularity="1"
          score="9.8"
          chapters="180"
          author="Chugong"
          artist="Jang Sung-Rak"
          publisher="D&C Media"
          synopsis="Sung Jinwoo (Aleks Le) é um simples caçador sem habilidades ou forças notáveis, mas um dia, após sobreviver a uma batalha que quase o levou à morte, é selecionado para um estranho programa chamado Sistema, para ser o único a receber raras habilidades, tornando-se possivelmente o caçador mais forte já visto."
        />
        <Card
          type="Manga"
          title="Shingeki no Kyojin"
          imageSrc="https://images8.alphacoders.com/108/1081458.jpg"
          popularity="2"
          score="9.6"
          chapters="139"
          author="Hajime Isayama"
          artist="Hajime Isayama"
          publisher="Kodansha"
          synopsis="A história de Shingeki no Kyojin gira em torno de uma humanidade que vem sendo exterminada por gigantes. Porém alguns seres humanos estão dispostos a mudar história e formar um exército de ataque aos seres assassinos. É assim que entra Eren, nosso protagonista, que após ver sua mãe ser devorada por um gigante, decide que não deixará nenhum deles vivo e buscará sua vingança completa."
        />
        <Card
          type="Manga"
          title="Naruto Clássico"
          imageSrc="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
          popularity="3"
          score="9.5"
          chapters="700"
          author="Masashi Kishimoto"
          artist="Masashi Kishimoto"
          publisher="Shueisha"
          synopsis="A obra gira em torno das aventuras vividas por Naruto Uzumaki, um jovem órfão habitante da Aldeia da Folha que sonha em se tornar o quinto Hokage, o maior guerreiro e governante da vila."
        />
        <Card
          type="Manhwa"
          title="The Beginning After The End"
          imageSrc="https://cdn.myanimelist.net/images/anime/1883/146143l.jpg"
          popularity="4"
          score="9.4"
          chapters="120"
          author="TurtleMe"
          artist="Fuyuki23"
          publisher="KakaoPage"
          synopsis="O protagonista, King Grey, foi transportado para outro mundo. Sua habilidade de administrar tudo o que o cerca o ajudará a se tornar o rei mais poderoso de todos os tempos? Acompanhe a história de King Grey e descubra."
        />
        <Card
          type="Manga"
          title="Fukushuu o Koinegau Saikyou Yuusha wa, Yami no Chikara de Senmetsu Musou Suru"
          imageSrc="https://i0.wp.com/irisscanlator.com.br/wp-content/uploads/2023/07/001.png"
          popularity="5"
          score="9.3"
          chapters="50"
          author="Ononata Manimani"
          artist="Yamigo"
          publisher="Shueisha"
          synopsis="Raul que derrotou o Rei Demônio como o herói mais forte deveria ter se tornado o salvador do mundo. Tendo seu precioso companheiro morto e traição de seus companheiros, ele foi executado na mão do Rei Demônio. No entanto, ele voltou ao passado. Raul que jurou vingança começou a andar pelo caminho da vingança com a escuridão em seu coração."
        />
      </div>
    </section>
  );
};

export default Cards_Container;
