import { useEffect, useRef, type RefObject } from 'react';
import EasyMDE from 'easymde';

type UseEasyMDEOptions = {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    placeholder?: string;
    initialValue?: string;
    minHeight?: string;
    toolbar?: EasyMDE.Options['toolbar'];
};

const DEFAULT_TOOLBAR: EasyMDE.Options['toolbar'] = [
    'bold',
    'italic',
    'strikethrough',
    'heading',
    '|',
    'code',
    'quote',
    '|',
    'unordered-list',
    'ordered-list',
    '|',
    'preview',
];

const COMPACT_TOOLBAR: EasyMDE.Options['toolbar'] = [
    'bold',
    'italic',
    'strikethrough',
    '|',
    'code',
    'quote',
    '|',
    'preview',
];

const useEasyMDE = ({
    textareaRef,
    placeholder = '',
    initialValue = '',
    minHeight = '6rem',
    toolbar,
}: UseEasyMDEOptions) => {
    const editorRef = useRef<EasyMDE | null>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea || editorRef.current) return;

        const instance = new EasyMDE({
            element: textarea,
            placeholder,
            initialValue,
            toolbar: toolbar ?? DEFAULT_TOOLBAR,
            spellChecker: false,
            autosave: { enabled: false, uniqueId: '' },
            status: false,
            minHeight,
            maxHeight: '20rem',
            autoDownloadFontAwesome: true,
            renderingConfig: {
                singleLineBreaks: true,
            },
        });

        editorRef.current = instance;

        return () => {
            instance.toTextArea();
            editorRef.current = null;
        };
        // Only run on mount/unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getValue = (): string => {
        return editorRef.current?.value() ?? '';
    };

    const setValue = (value: string) => {
        editorRef.current?.value(value);
    };

    const clearValue = () => {
        editorRef.current?.value('');
    };

    return { getValue, setValue, clearValue, editorRef };
};

export { COMPACT_TOOLBAR, DEFAULT_TOOLBAR };
export default useEasyMDE;
