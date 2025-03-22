import { useCallback } from 'react';
import { MdAdminPanelSettings, MdStar } from 'react-icons/md';

import clsx from 'clsx';

type CommentProps = {
  nestedLevel?: 0 | 1 | 2 | 3 | 4;

  isOwner?: boolean;
  isHighlighted?: boolean;
  isModerator?: boolean;
  isMember?: boolean;
  wasEdited?: boolean;

  userName: string;
  userPhoto: string;
  date: Date;
  text?: string;
  image?: string;

  onClickProfile: () => void;
};

const Comment = ({
  nestedLevel = 0,

  isOwner,
  isHighlighted,
  isModerator,
  isMember,
  wasEdited,

  userName,
  userPhoto,
  date,
  text,
  image,

  onClickProfile,
}: CommentProps) => {
  const treatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };

    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  };

  console.log(onClickProfile);

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

  if (!text && !image) {
    return null;
  }

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
          marginLeft: nestedLevel === 0 ? 0 : 8 + 'px',
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
            <span className=" text-shadow-default">{treatDate(date)}</span>
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
              onClick={() => {
                console.log('Foto do usuário clicada');

                onClickProfile();
              }}
              src={userPhoto}
              alt={`Foto de perfil de ${userName}`}
              className="object-cover w-full h-full rounded-sm"
            />
          </div>

          {/* Detalhes do usuário */}
          <div className="flex flex-col justify-center overflow-hidden">
            {isMember && (
              <div>
                <span
                  onClick={onClickProfile}
                  className="flex items-center gap-1 text-sm font-bold leading-none text-shadow-highlight"
                >
                  <span>Membro</span>
                  <MdStar size={16} />
                </span>
              </div>
            )}
            {isModerator && (
              <div>
                <span
                  onClick={onClickProfile}
                  className="flex items-center gap-1 text-sm font-bold leading-none text-shadow-highlight"
                >
                  <span>Moderador</span>
                  <MdAdminPanelSettings size={16} />
                </span>
              </div>
            )}
            <div>
              <h4
                onClick={onClickProfile}
                className={clsx(
                  'leading-none font-bold truncate text-shadow-default',
                  {
                    'text-shadow-default': isHighlighted,
                  }
                )}
              >
                {userName}
              </h4>
            </div>
          </div>
        </div>

        {/* Texto do comentário */}
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-justify">{text}</p>
          </div>

          {/* Imagem do comentário */}
          {image && (
            <div>
              <img
                className="object-cover w-full rounded-sm max-h-64"
                src={image}
                alt={`Imagem do comentário de ${userName}`}
              />
            </div>
          )}
        </div>

        {/* Camada de ações*/}
        <div
          className={clsx('flex', {
            'justify-end': !isOwner,
            'justify-between': isOwner,
          })}
        >
          {isOwner && (
            <div className="flex gap-2">
              <button className="p-2 text-xs rounded-sm shadow-lg bg-primary-default">
                <span>Editar</span>
              </button>
              <button className="p-2 text-xs rounded-sm shadow-lg bg-primary-default">
                <span>Excluir</span>
              </button>
            </div>
          )}
          <div>
            <button className="p-2 text-xs rounded-sm shadow-lg bg-primary-default">
              <span>Responder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;
