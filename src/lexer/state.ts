import type { Token } from '../../types/tokens.d.ts'

export default class LexerState {
    private source: string = ''
    private cursor: number = 0
    private tokens: Array<Token> = []
    private row: number = 0
    private column: number = 0

    constructor(newSource: string) {
        this.source = newSource
        this.cursor = 0
        this.tokens = []
    }
    
    increment(): void {
        this.cursor++
        if (this.source[this.cursor] === '\n') {
            this.row++
            this.column = 0
        } else {
            this.column++
        }
    }
    
    peek(offset: number = 0): string {
        return this.source[this.cursor + offset]
    }

    advance(): string {
        const currentChar = this.peek()
        this.increment()
        return currentChar
    }
    
    isAtEnd(): boolean {
        return this.cursor > this.source.length
    }

    push(type: string, lexeme: string, literal: string | null): void {
        this.tokens.push({
            type, lexeme, literal,
            row: this.row, column: this.column
        })
    }

    getTokens(): Array<Token> {
        return this.tokens
    }
}
