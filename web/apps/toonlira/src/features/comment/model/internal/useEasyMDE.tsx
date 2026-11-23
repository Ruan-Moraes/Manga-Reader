import { useEffect, useRef, type RefObject } from 'react';

import EasyMDE from 'easymde';

type UseEasyMDEOptions = {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    placeholder?: string;
    initialValue?: string;
    minHeight?: string;
    toolbar?: EasyMDE.Options['toolbar'];
};

// Botão custom: envolve a seleção em `||...||` (spoiler do nosso markdown).
const SPOILER_BUTTON: EasyMDE.ToolbarIcon = {
    name: 'spoiler',
    title: 'Spoiler',
    className: 'fa fa-eye-slash',
    action: (editor: EasyMDE) => {
        const cm = editor.codemirror;
        const selection = cm.getSelection() || 'spoiler';
        cm.replaceSelection(`||${selection}||`);
        cm.focus();
    },
};

const DEFAULT_TOOLBAR: EasyMDE.Options['toolbar'] = [
    'bold',
    'italic',
    'strikethrough',
    'heading',
    '|',
    'code',
    'quote',
    SPOILER_BUTTON,
    '|',
    'unordered-list',
    'ordered-list',
    '|',
    'preview',
];

const COMPACT_TOOLBAR: EasyMDE.Options['toolbar'] = ['bold', 'italic', 'strikethrough', '|', 'code', 'quote', SPOILER_BUTTON, '|', 'preview'];

const useEasyMDE = ({ textareaRef, placeholder = '', initialValue = '', minHeight = '6rem', toolbar }: UseEasyMDEOptions) => {
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
        // EasyMDE é imperativo (DOM-bound): init roda uma vez no mount, props
        // (`placeholder`/`initialValue`/`minHeight`/`toolbar`) só semeiam estado
        // inicial — re-rodar destruiria o editor e perderia o conteúdo digitado
        // pelo usuário. Omissão intencional.
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
