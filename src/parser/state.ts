import type { Node, Program } from '../../types/nodes.d.ts'
import type { Token } from '../../types/tokens.d.ts'
import error from '../shared/error.ts'

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

    expect(expectedType: string): void {
        const actualToken: Token = this.peek()

        if (expectedType !== actualToken.type) {
            error(`Unexpected token "${actualToken.lexeme}", expected "${expectedType}"`)
        } else {
            this.increment()
        }
    }

    push(node: Node): void {
        this.ast.body.push(node)
    }
}