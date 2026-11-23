export type Chapter = {
    /** ObjectId interno do capítulo no Mongo — usado como targetId de comentários. */
    id: string;
    number: string;
    title: string;
    releaseDate: string;
    pages: string;
};
