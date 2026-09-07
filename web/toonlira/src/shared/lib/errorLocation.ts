export interface ErrorLocation {
    file: string;
    line: number;
    column: number;
}

const STACK_LOCATION_PATTERN = /(?:\(|\s|@)((?:https?:\/\/|file:\/\/|\/)[^\s()]+):(\d+):(\d+)\)?/;

export function getErrorLocation(stack?: string): ErrorLocation | null {
    if (!stack) return null;

    for (const frame of stack.split('\n').slice(1)) {
        const match = frame.match(STACK_LOCATION_PATTERN);
        if (!match) continue;

        return {
            file: decodeURIComponent(match[1].split('?')[0]),
            line: Number(match[2]),
            column: Number(match[3]),
        };
    }

    return null;
}

export function getFileName(file: string): string {
    return file.split('/').filter(Boolean).at(-1) ?? file;
}
