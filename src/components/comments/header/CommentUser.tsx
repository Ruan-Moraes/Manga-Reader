import clsx from 'clsx';

import { UserTypes } from '../../../types/UserTypes';

import { MdAdminPanelSettings, MdStar } from 'react-icons/md';

type CommentUserProps = {
  onClickProfile: (userData: UserTypes) => void;

  isHighlighted?: boolean;

  user: UserTypes;
};

const CommentUser = ({
  onClickProfile,
  isHighlighted,
  user,
}: CommentUserProps) => {
  return (
    <div className="flex gap-2">
      <div className="w-16 h-16 rounded-sm shrink-0">
        <img
          onClick={() => onClickProfile(user)}
          src={user.photo}
          alt={`Foto de perfil de ${user.name}`}
          className="object-cover w-full h-full rounded-sm"
        />
      </div>
      <div className="flex flex-col justify-center overflow-hidden">
        {user.member?.isMember && (
          <div>
            <span
              onClick={() => onClickProfile(user)}
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
              onClick={() => onClickProfile(user)}
              className="flex items-center gap-1 text-sm font-bold leading-none text-shadow-highlight"
            >
              <span>Moderador</span>
              <MdAdminPanelSettings size={16} />
            </span>
          </div>
        )}
        <div>
          <h4
            onClick={() => onClickProfile(user)}
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
  );
};

export default CommentUser;
