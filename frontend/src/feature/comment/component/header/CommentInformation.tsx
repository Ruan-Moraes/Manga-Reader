import treatDate from '@shared/service/util/treatDate';

type CommentInformationProps = {
    createdAt: string;
    wasEdited: boolean;
};

const CommentInformation = ({
    createdAt,
    wasEdited,
}: CommentInformationProps) => {
    return (
        <div className="flex justify-end gap-2 text-[0.5625rem]">
            <div className="px-2 py-1 rounded-xs shadow-lg bg-primary-default">
                <span className="text-shadow-default">
                    {treatDate(createdAt, {
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
