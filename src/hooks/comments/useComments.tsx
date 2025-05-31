import {useEffect, useState} from 'react';

import {CommentTypes} from '../../types/CommentTypes';

export function useComments(id: number) {
    const [comments, setComments] = useState<CommentTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/comments/${id}`);

                const data = await response.json();

                setComments(data);
            } catch (error) {
                console.error('Erro ao buscar comentários:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchComments();
    }, [id]);

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/comments/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setComments((prev) => prev.filter((c) => c.id !== id));
            }

            if (!response.ok) {
                console.error('Erro ao excluir comentário:', response.statusText);
            }
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
        }
    };

    return {comments, isLoading, handleDelete};
}
