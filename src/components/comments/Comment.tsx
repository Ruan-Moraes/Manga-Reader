import { AiFillLike } from 'react-icons/ai';
import { AiFillDislike } from 'react-icons/ai';
import { MdAdminPanelSettings, MdStar } from 'react-icons/md';
import { FaRegTrashAlt } from 'react-icons/fa';

import clsx from 'clsx';

import { UserTypes } from '../../types/UserTypes';

import treatDate from '../../services/utils/treatDate';

type CommentProps = {
  onClickProfile: (userData: UserTypes) => void;
  nestedLevel?: number;

  isOwner?: boolean;
  isHighlighted?: boolean;
  wasEdited?: boolean;
  commentData: Date;
  commentText?: string;
  commentImage?: string;

  user: UserTypes;
};

const Comment = ({
  onClickProfile,
  nestedLevel = 0,

  isOwner,
  isHighlighted,
  wasEdited,

  commentData,
  commentText,
  commentImage,

  user,
}: CommentProps) => {
  if (!commentText && !commentImage) {
    return null;
  }

  const userData: UserTypes = {
    id: user.id,
    moderator: user.moderator,
    member: user.member,

    name: user.name,
    photo: user.photo,
  };

  const calculateNastedComment = (nestedLevel: number) => {
    if (nestedLevel === 0) {
      return 0;
    }

    if (nestedLevel === 1) {
      return 8;
    }

    return nestedLevel * 8 + 8 * (nestedLevel - 1);
  };

  const calculateNestedBorder = (index: number) => {
    if (index === 0) {
      return -8;
    }

    if (index === 1) {
      return -24;
    }

    return -(index * 8 + 8 * (index + 1));
  };

  return (
    <div
      style={{ marginLeft: calculateNastedComment(nestedLevel) + 'px' }}
      className={clsx({
        [`relative`]: nestedLevel > 0,
      })}
    >
      {nestedLevel > 0 &&
        Array.from({ length: nestedLevel }, (_, index) => (
          <div
            key={index}
            className="absolute h-full border-l border-quaternary-opacity-25"
            style={{
              left: calculateNestedBorder(index) + 'px',
            }}
          ></div>
        ))}
      {nestedLevel > 0 && (
        <div className="absolute w-[0.9375rem] border-t -left-[0.4453125rem] border-quaternary-opacity-25 top-6"></div>
      )}

      <div
        style={{
          marginLeft: nestedLevel === 0 ? 0 : 0.5 + 'rem',
        }}
        className={clsx(
          'flex flex-col gap-2 p-2 border rounded-sm rounded-bl-none border-tertiary mt-4',
          {
            'bg-secondary': !isHighlighted,
            'bg-quaternary-opacity-25': isHighlighted,
          }
        )}
      >
        {/*
          Cabeçalho do comentário:
          - Data de publicação
          - Se foi editado
        */}
        <div className="flex justify-end gap-2 text-[0.5625rem]">
          <div className="px-2 py-1 rounded-sm shadow-lg bg-primary-default">
            <span className=" text-shadow-default">
              {treatDate(commentData, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              })}
            </span>
          </div>
          {wasEdited && (
            <div className="px-2 py-1 rounded-sm shadow-lg bg-primary-default">
              <span className=" text-shadow-default">Editada</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* Foto do usuário */}
          <div className="w-16 h-16 rounded-sm shrink-0">
            <img
              onClick={() => onClickProfile(userData)}
              src={user.photo}
              alt={`Foto de perfil de ${user.name}`}
              className="object-cover w-full h-full rounded-sm"
            />
          </div>

          {/* Detalhes do usuário */}
          <div className="flex flex-col justify-center overflow-hidden">
            {user.member?.isMember && (
              <div>
                <span
                  onClick={() => onClickProfile(userData)}
                  className="flex items-center gap-1 text-sm font-bold leading-none text-shadow-highlight"
                >
                  <span>Membro</span>
                  <MdStar size={16} />
                </span>
              </div>
            )}
            {user.moderator?.isModerator && (
              <div>
                <span
                  onClick={() => onClickProfile(userData)}
                  className="flex items-center gap-1 text-sm font-bold leading-none text-shadow-highlight"
                >
                  <span>Moderador</span>
                  <MdAdminPanelSettings size={16} />
                </span>
              </div>
            )}
            <div>
              <h4
                onClick={() => onClickProfile(userData)}
                className={clsx(
                  'leading-none font-bold truncate text-shadow-default',
                  {
                    'text-shadow-default': isHighlighted,
                  }
                )}
              >
                {user.name}
              </h4>
            </div>
          </div>
        </div>

        {/* Texto do comentário */}
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-justify">{commentText}</p>
          </div>

          {/* Imagem do comentário */}
          {commentImage && (
            <div>
              <img
                className="object-cover w-full rounded-sm max-h-64"
                src={commentImage}
                alt={`Imagem do comentário de ${user.name}`} // TODO: Alterar para quando o sistema de comentários estiver pronto
              />
            </div>
          )}
        </div>

        {/* Camada de ações*/}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
              <AiFillDislike />
            </button>
            <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
              <AiFillLike />
            </button>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
                <FaRegTrashAlt />
              </button>
            )}
            <button className="px-3 py-2 text-xs rounded-sm shadow-lg bg-primary-default">
              Responder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;
