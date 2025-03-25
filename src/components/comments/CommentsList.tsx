import { useUserModalContext } from '../../context/user/useUserModalContext';

import UserModal from '../modals/user/UserModal';
import Comment from './Comment';

import { UserTypes } from '../../types/UserTypes';

const CommentsList = () => {
  const { openUserModal, setUserData } = useUserModalContext();

  // const fetchComments = async () => {}; // TODO: Implementar função para buscar os comentários do usuário

  // useEffect(() => {
  // fetchComments();
  // }, []);

  const handleClickProfile = ({
    id,
    moderator,
    member,

    name,
    photo,
  }: UserTypes): void => {
    setUserData({
      id,
      moderator,
      member,

      name,
      photo,
    });

    openUserModal();
  };

  return (
    <div className="flex flex-col -mt-4">
      <UserModal />
      <Comment
        nestedLevel={0}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        isOwner
        isHighlighted
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={1}
        onClickProfile={handleClickProfile}
        user={{
          id: '2',
          name: 'Naruto Uzumaki',
          photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
          member: {
            isMember: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        }}
        wasEdited
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={1}
        onClickProfile={handleClickProfile}
        user={{
          id: '3',
          name: 'Sasuke Uchiha',
          photo:
            'https://boo-prod.b-cdn.net/database/profiles/16779658133692cab7e879edd111139eefe3687a5e51c.jpg?class=sm',
        }}
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?"
      />
      <Comment
        onClickProfile={handleClickProfile}
        user={{
          id: '2',
          name: 'Naruto Uzumaki',
          photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
          member: {
            isMember: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        }}
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={1}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        isOwner
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={2}
        onClickProfile={handleClickProfile}
        user={{
          id: '4',
          name: 'Hinata Hyuga',
          photo:
            'https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={3}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        isOwner
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={4}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        isOwner
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={4}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        isOwner
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={3}
        onClickProfile={handleClickProfile}
        user={{
          id: '1',
          name: 'Usuário de alta periculosidade',
          photo:
            'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
          moderator: {
            isModerator: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 2)
            ),
          },
        }}
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har."
      />
      <Comment
        nestedLevel={0}
        onClickProfile={handleClickProfile}
        user={{
          id: '4',
          name: 'Hinata Hyuga',
          photo:
            'https://pt.quizur.com/_image?href=https%3A%2F%2Fimg.quizur.com%2Ff%2Fimg631b0d291bede6.24534360.jpg%3FlastEdited%3D1662717231&w=600&h=600&f=webp',
          member: {
            isMember: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        }}
        commentData={new Date()}
        commentImage="https://t.ctcdn.com.br/LH0-pVW87nALWza-n2YXafNP-ng=/768x432/smart/i598772.jpeg"
      />
      <Comment
        nestedLevel={1}
        onClickProfile={handleClickProfile}
        user={{
          id: '5',
          name: 'Sakura Haruno',
          photo:
            'https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png',
        }}
        commentData={new Date()}
        commentText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?"
        commentImage="https://c0.klipartz.com/pngpicture/77/557/gratis-png-kyon-anime-manga-internet-meme-haruhi-suzumiya-anime.png"
      />
    </div>
  );
};

export default CommentsList;
