import treatDate from '../../../services/utils/treatDate';

type CommentInformationProps = {
  commentData: Date;
  wasEdited: boolean | undefined;
};

const CommentInformation = ({
  commentData,
  wasEdited,
}: CommentInformationProps) => {
  return (
    <div className="flex justify-end gap-2 text-[0.5625rem]">
      <div className="px-2 py-1 rounded-xs shadow-lg bg-primary-default">
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
        <div className="px-2 py-1 rounded-xs shadow-lg bg-primary-default">
          <span className=" text-shadow-default">Editado</span>
        </div>
      )}
    </div>
  );
};

export default CommentInformation;
