import { useCallback, useEffect } from 'react';

import useCommentChat from '../../../../../hooks/comments/internal/useCommentChat';

import BaseButton from '../../../../buttons/BaseButton';

type EditModalBodyProps = {
    onEdit: (newTextContent?: string, newImageContent?: string) => void;
    onCancel: () => void;
    initialText?: string;
    initialImages?: string;
};

const EditModalBody = ({
    onEdit,
    onCancel,
    initialText,
    initialImages,
}: EditModalBodyProps) => {
    const { textareaRef, addImage, handleInputChange, handleBlur } =
        useCommentChat(initialText || 'Escreva seu comentário...');

    useEffect(() => {
        const textarea = textareaRef.current;

        if (textarea) {
            textarea.innerHTML = '';

            if (initialText) {
                textarea.innerText = initialText;
            }
            // TODO: Se você tiver `initialImages` como uma string, e ela for um URL de imagem,
            // precisará de uma lógica para injetar essa imagem no `textareaRef` no formato HTML
            // que `useCommentChat` espera para imagens.
            // Exemplo simples (pode precisar de refinamento para múltiplos ou formato específico):
            // if (initialImages) {
            //    const imgHTML = `<div contenteditable="false" style="position: relative; display: inline-block; max-width: max-content;">
            //                         <img src="${initialImages}" style="max-height: 30rem; border-radius: 0.125rem; display: block; object-fit: cover;" />
            //                         <button type="button" class="remove-img-btn" style="position: absolute; top: 0; right: 0;">X</button>
            //                     </div>`;
            //    textarea.innerHTML += imgHTML;
            // }

            // Garante que o placeholder seja aplicado corretamente após a inicialização
            if (!initialText && !initialImages) {
                // Apenas se não houver conteúdo inicial
                handleBlur(); // Para adicionar o placeholder se estiver vazio
            }
        }
    }, [initialText, initialImages, textareaRef, handleBlur]);

    // A função `handleEdit` agora capturará o conteúdo do editor
    const handleEdit = useCallback(() => {
        const newText = getTextContent(); // Obtém o texto do editor
        // Para imagens, você pode obter a primeira imagem ou uma lista dependendo da sua necessidade
        const newImage = images.length > 0 ? images[0] : undefined;

        // Chama a prop `onEdit` com o payload completo
        onEdit({ newTextContent: newText, newImageContent: newImage });
    }, [onEdit, getTextContent, images]); // `images` e `getTextContent` são dependências do `useCommentChat`

    return (
        <div className="flex flex-col gap-4">
            {/* O editor de conteúdo */}
            <div
                ref={textareaRef}
                contentEditable="true"
                className="border p-2 min-h-[100px] max-h-[300px] overflow-y-auto rounded"
                // Adicione os handlers de input e blur do useCommentChat
                onInput={handleInputChange}
                onBlur={handleBlur}
            >
                {/* Conteúdo será injetado pelo useEffect e gerenciado pelo useCommentChat */}
            </div>

            <div className="flex justify-end gap-2">
                <BaseButton text="Cancelar" onClick={onCancel} />
                <BaseButton text="Editar" onClick={handleEdit} />{' '}
                {/* Chama handleEdit para capturar o conteúdo */}
            </div>
        </div>
    );
};

export default EditModalBody;
