const RouteSuspenseFallback = () => {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center" role="status" aria-live="polite">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-mr-border border-t-mr-accent-border" />
            <span className="sr-only">Loading</span>
        </div>
    );
};

export default RouteSuspenseFallback;
