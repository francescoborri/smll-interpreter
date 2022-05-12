export enum SmLLErrorKind {
    LEXICAL_ERROR = 'LEXICAL_ERROR',
    SYNTAX_ERROR = 'SYNTAX_ERROR',
    STATIC_SEMANTIC_ERROR = 'STATIC_SEMANTIC_ERROR',
    DYNAMIC_SEMANTIC_ERROR = 'DYNAMIC_SEMANTIC_ERROR'
}

export class SmLLError extends Error {
    message: string
    kind: SmLLErrorKind
    line: number
    column: number

    constructor(message: string, kind: SmLLErrorKind, line: number, column: number) {
        super(`'${kind}' at line ${line}, column ${column}: '${message}'`)
        this.message = message
        this.kind = kind
        this.line = line
        this.column = column
    }
}