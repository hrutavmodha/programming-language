import type { Node, Program } from '../../types/nodes.d.ts'
import type { Token } from '../../types/tokens.d.ts'
import error from '../shared/error.ts'
import { filePath } from '../index.ts'
import { readFileSync } from 'fs'

export default class ParserState {
    private tokens: Array<Token> = []
    private cursor: number = 0
    private ast: Program = {
        type: 'Program',
        body: []
    }

    constructor(tokens: Array<Token>) {
        this.tokens = tokens
        this.cursor = 0
        this.ast = {
            type: 'Program',
            body: []
        }
    }

    increment(): void {
        this.cursor++
    }

    advance(): Token {
        return this.tokens[this.cursor++]
    }

    peek(offset: number = 0): Token {
        return this.tokens[this.cursor + offset]
    }
    
    isAtEnd(): boolean {
        return this.tokens[this.cursor].type === 'EndOfFile'
    }

    getAst(): Program {
        return this.ast
    }

    expect(expectedLexeme: string): void {
        const actualToken: Token = this.peek()
        let hasError: boolean = false
        let errStr: string = ''
        
        if (this.isAtEnd()) {
            errStr +='Error: Unexpected end of input, expected '
            if (expectedLexeme === 'IDENTIFIER') {
                errStr +='identifier name'
            } else {
                errStr +=`"${expectedLexeme}"`
            }
            
            errStr +='\n'
            hasError = true
        } else if (expectedLexeme === 'IDENTIFIER') {
            if (actualToken.type !== 'IDENTIFIER') {
                errStr +=`Error: Unexpected token "${actualToken.lexeme}", expected an identifier name\n`
                hasError = true 
            } else {
                this.increment()
            }
        } else if (expectedLexeme !== actualToken.lexeme) {
            errStr +=`Error: Unexpected token "${actualToken.lexeme}", expected "${expectedLexeme}"\n`
            hasError = true
        } else {
            this.increment()
        }
        
        if (hasError) {
            const errorLine = readFileSync(filePath).toString().split('\n')[actualToken.row] || ''
            errStr += `File ${filePath}:${actualToken.row + 1}:${actualToken.column}\n`
            errStr += `${actualToken.row + 1} | ${errorLine}\n`

            const prefixLen = (actualToken.row + 1).toString().length + 3
            for (let i = 0; i < prefixLen + actualToken.column; i++) {
                errStr += ' '
            }

            errStr += '^'
            error(errStr)
        }
    }

    push(node: Node): void {
        this.ast.body.push(node)
    }
}