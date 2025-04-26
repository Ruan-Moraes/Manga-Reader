import { useState, useCallback, useEffect } from 'react';

import {
  CommentTypes,
  CommentWithChildrenTypes,
} from '../../types/CommentTypes';
import { UserTypes } from '../../types/UserTypes';

import { useUserModalContext } from '../../context/modals/user/useUserModalContext';

import UserModal from '../modals/user/UserModal';
import Comment from './Comment';

const CommentsList = () => {
  const { openUserModal, setUserData } = useUserModalContext();
  const [comments, setComments] = useState<
    Omit<CommentTypes, 'onClickProfile'>[]
  >([]);

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

  // * Mock data
  const fetchComments = useCallback(() => {
    const comments = [
      {
        commentId: '1856c659-5e1d-4750-9777-74e3496e01da',
        user: {
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
        },
        isOwner: true,
        isHighlighted: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: '3dd84f94-dd37-4bb2-aa91-990c61b44719',
        parentCommentId: '1856c659-5e1d-4750-9777-74e3496e01da',
        user: {
          id: '2',
          name: 'Naruto Uzumaki',
          photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
          member: {
            isMember: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        wasEdited: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'cb64cd92-65f4-47c2-b64b-9f7080928041',
        parentCommentId: '1856c659-5e1d-4750-9777-74e3496e01da',
        user: {
          id: '3',
          name: 'Sasuke Uchiha',
          photo:
            'https://boo-prod.b-cdn.net/database/profiles/16779658133692cab7e879edd111139eefe3687a5e51c.jpg?class=sm',
        },
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?',
      },
      {
        commentId: 'f1b0c4a2-3d5e-4f8b-8c7d-9a6e0f1b2c3e',
        user: {
          id: '2',
          name: 'Naruto Uzumaki',
          photo: 'https://storage.googleapis.com/pod_public/1300/207360.jpg',
          member: {
            isMember: true,
            since: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: '34c6b2c6-59fc-4ac3-bddc-76d4f73ccc38',
        parentCommentId: 'f1b0c4a2-3d5e-4f8b-8c7d-9a6e0f1b2c3e',
        user: {
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
        },
        isOwner: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
        parentCommentId: '34c6b2c6-59fc-4ac3-bddc-76d4f73ccc38',
        user: {
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
        },
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'f7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
        parentCommentId: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
        user: {
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
        },
        isOwner: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'v3w4x5y6-z7a8-9b0c-1d2e-3f4g5h6i7j8k',
        parentCommentId: 'f7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
        user: {
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
        },
        isOwner: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'l9m0n1o2-p3q4-5r6s-7t8u-9v0w1x2y3z4a',
        parentCommentId: 'f7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
        user: {
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
        },
        isOwner: true,
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'b5c6d7e8-f9a0-1b2c-3d4e-5f6g7h8i9j0k',
        parentCommentId: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
        user: {
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
        },
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
      },
      {
        commentId: 'd1e2f3g4-h5i6-7j8k-9l0m-1n2o3p4q5r6s',
        user: {
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
        },
        commentData: new Date(),
        commentImage:
          'https://t.ctcdn.com.br/LH0-pVW87nALWza-n2YXafNP-ng=/768x432/smart/i598772.jpeg',
      },
      {
        commentId: 'e2f3b4c5-6d7e-4f8b-9a0b-1c2d3e4f5g6h',
        parentCommentId: 'd1e2f3g4-h5i6-7j8k-9l0m-1n2o3p4q5r6s',
        user: {
          id: '5',
          name: 'Sakura Haruno',
          photo:
            'https://cdn.ome.lt/uno0VMDEDgYjPNHHzp01Pxpzs6M=/987x0/smart/uploads/conteudo/fotos/Design_sem_nome-346.png',
        },
        commentData: new Date(),
        commentText:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit?',
        commentImage:
          'https://c0.klipartz.com/pngpicture/77/557/gratis-png-kyon-anime-manga-internet-meme-haruhi-suzumiya-anime.png',
      },
    ];

    setComments(comments);
  }, []);

  const createCommentMap = useCallback((comments: CommentTypes[]) => {
    const map = new Map<string, CommentWithChildrenTypes>();

    comments.forEach((comment) => {
      map.set(comment.commentId, { ...comment, children: [] });
    });

    return map;
  }, []);

  const buildTree = useCallback(
    (map: Map<string, CommentWithChildrenTypes>, comments: CommentTypes[]) => {
      const roots: CommentWithChildrenTypes[] = [];

      comments.forEach((comment) => {
        const mappedComment = map.get(comment.commentId)!;

        if (comment.parentCommentId) {
          const parent = map.get(comment.parentCommentId);

          parent?.children.push(mappedComment);
        }

        if (!comment.parentCommentId) {
          roots.push(mappedComment);
        }
      });

      return roots;
    },
    []
  );

  const flattenTree = useCallback(
    (
      comments: CommentWithChildrenTypes[],
      level = 0
    ): { comment: CommentTypes; nestedLevel: number }[] => {
      return comments.flatMap((comment) => [
        {
          comment: { ...comment, children: undefined },
          nestedLevel: level,
        },
        ...flattenTree(comment.children, level + 1),
      ]);
    },
    []
  );

  const buildCommentTree = useCallback(() => {
    const commentMap = createCommentMap(comments as CommentTypes[]);
    const rootComments = buildTree(commentMap, comments as CommentTypes[]);

    return flattenTree(rootComments);
  }, [buildTree, createCommentMap, comments, flattenTree]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="flex flex-col -mt-4">
      <UserModal />
      {buildCommentTree().map(({ comment, nestedLevel }) => (
        <Comment
          key={comment.commentId}
          onClickProfile={handleClickProfile}
          commentId={comment.commentId}
          parentCommentId={comment.parentCommentId}
          nestedLevel={nestedLevel}
          user={comment.user}
          isOwner={comment.isOwner}
          isHighlighted={comment.isHighlighted}
          wasEdited={comment.wasEdited}
          commentData={comment.commentData}
          commentText={comment.commentText}
          commentImage={comment.commentImage}
        />
      ))}
    </div>
  );
};

export default CommentsList;
