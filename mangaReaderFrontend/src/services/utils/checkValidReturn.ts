const checkValidReturn = (response: Response): void => {
    if (response === null || response === undefined || !response.ok) {
        throw new Error(response.statusText || 'Resposta inválida da API');
    }
};

export default checkValidReturn;
