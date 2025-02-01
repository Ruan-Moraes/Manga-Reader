// import { useState } from 'react';

import Comment from './Comment';
import UserModal from '../user/UserModal';

// type CommentProps = {
//   isOwner: boolean; // Alterar quando a autenticação estiver pronta
//   isHighlighted: boolean;
//   isModerator: boolean;
//   isMember: boolean;
//   wasEdited: boolean;
//   userName: string;
//   userPhoto: string;
//   date: string;
//   text: string;
//   image: string;
//   answers: CommentProps[];
// };

const CommentsList = () => {
  // const [comments, setComments] = useState<CommentProps[]>([]);

  // Todo: Fetch comments from the server
  // const getComments = async () => {
  //
  // };

  return (
    <div className="flex flex-col -mt-4">
      <UserModal />
      <Comment
        isOwner
        isHighlighted
        isModerator
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isMember
        nestedLevel={1}
        wasEdited
        userName="Naruto Uzumaki"
        userPhoto="https://storage.googleapis.com/pod_public/1300/207360.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        userName="Sasuke Uchiha"
        nestedLevel={1}
        userPhoto="https://boo-prod.b-cdn.net/database/profiles/16779658133692cab7e879edd111139eefe3687a5e51c.jpg?class=sm"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?"
      />
      <Comment
        isMember
        userName="Naruto Uzumaki"
        userPhoto="https://storage.googleapis.com/pod_public/1300/207360.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isModerator
        nestedLevel={1}
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isMember
        nestedLevel={2}
        userName="Hinata Hyuga"
        userPhoto="https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isOwner
        nestedLevel={3}
        isModerator
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isOwner
        nestedLevel={4}
        isModerator
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isOwner
        nestedLevel={4}
        isModerator
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        isOwner
        nestedLevel={3}
        isModerator
        userName="Usuário de alta periculosidade"
        userPhoto="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        userName="Sakura Haruno"
        nestedLevel={1}
        userPhoto="https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        userName="Sakura Haruno"
        nestedLevel={1}
        userPhoto="https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png"
        date={new Date()}
      />
      <Comment
        isMember
        nestedLevel={2}
        userName="Hinata Hyuga"
        userPhoto="https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp"
        date={new Date()}
        image="https://t.ctcdn.com.br/LH0-pVW87nALWza-n2YXafNP-ng=/768x432/smart/i598772.jpeg"
      />
      <Comment
        userName="Sakura Haruno"
        nestedLevel={3}
        userPhoto="https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png"
        date={new Date()}
        text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?"
        image="https://c0.klipartz.com/pngpicture/77/557/gratis-png-kyon-anime-manga-internet-meme-haruhi-suzumiya-anime.png"
      />
    </div>
  );
};

export default CommentsList;
