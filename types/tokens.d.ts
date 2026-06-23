export interface Token {
    type: string,
    lexeme: string,
    literal: string | null
    row?: number,
    column?: number,
    length?: number,
    index?: number
}