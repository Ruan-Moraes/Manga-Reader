export interface TestimonialMeta {
    initials: string;
    color: string;
    rating: number;
}

export const TESTIMONIALS_META: TestimonialMeta[] = [
    { initials: 'AL', color: '#ddda2a', rating: 5 },
    { initials: 'CM', color: '#FF784F', rating: 5 },
    { initials: 'JS', color: '#cccccc', rating: 5 },
    { initials: 'RT', color: '#7fd1b9', rating: 4 },
];

export interface TestimonialText {
    name: string;
    role: string;
    text: string;
}
