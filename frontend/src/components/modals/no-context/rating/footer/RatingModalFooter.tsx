type RatingModalFooterProps = {
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    isDisabled: boolean;
};

const RatingModalFooter = ({
    onSubmit,
    onCancel,
    isSubmitting,
    isDisabled,
}: RatingModalFooterProps) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={onSubmit}
                disabled={isDisabled || isSubmitting}
                className="flex-1 px-4 py-2 text-sm text-white border rounded-xs bg-primary border-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? 'Enviando...' : 'Avaliar'}
            </button>
        </div>
    );
};

export default RatingModalFooter;
