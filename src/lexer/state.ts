import type { Token } from '../../types/tokens.d.ts'
import error from '../shared/error.ts'
import { filePath } from '../index.ts'
import { readFileSync } from 'fs'

export default class LexerState {
    private source: string = ''
    private cursor: number = 0
    private tokens: Array<Token> = []
    public row: number = 0
    public column: number = 0
    private startRow: number = 0
    private startColumn: number = 0

    constructor(newSource: string) {
        this.source = newSource
        this.cursor = 0
        this.tokens = []
    }
    
    increment(): void {
        const char = this.source[this.cursor]
        this.cursor++
        if (char === '\n') {
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

    recordStart(): void {
        this.startRow = this.row
        this.startColumn = this.column
    }

    reportError(msg: string) {
        let errStr = ''

        const errorLine = readFileSync(filePath).toString().split('\n')[this.row]

        errStr += 'Error: ' + msg + '\n'
        errStr += `File ${filePath}:${this.row + 1}:${this.column}\n`
        errStr += `${this.row + 1} | ${errorLine}\n  `
        
        for (let i = 0; i < this.column; i++) {
            errStr += ' '
        }

        errStr += '^'

        error(errStr)
    }

    push(type: string, lexeme: string, literal: string | null): void {
        this.tokens.push({
            type, lexeme, literal,
            row: this.startRow, column: this.startColumn,
            length: lexeme.length
        })
    }

    getTokens(): Array<Token> {
        return this.tokens
    }
}
