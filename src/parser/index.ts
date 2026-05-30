import ParserState from './state.ts';

export default class Parser {
    private state: ParserState;

    constructor(state: ParserState) {
        this.state = state
    }

    parse(): any {
        while (!this.state.isAtEnd()) {
            this.state.push(this.parseStatement())
        }

        return this.state.getAst()
    }

    private parseStatement(): any {
        const token = this.state.peek()

        switch (token.type) {
            case 'KEYWORD_LET': {
                return this.parseVariableDeclaration()
            } default: {
                return this.parseExpression()
            }
        }
    }

    private parseExpression(): any {
        return this.parseEquality()
    }

    private parseEquality(): any {
        let left: any = this.parseComparison()

        while (this.state.peek()?.type === 'EQUALS' || this.state.peek()?.type === 'DOUBLE_EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseComparison()

            left = {
                type: 'ComparisonExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseComparison(): any {
        let left: any = this.parseAdditive()

        while (this.state.peek()?.type === 'GREATER_THAN' || this.state.peek()?.type === 'GREATER_THAN_OR_EQUALS' || this.state.peek()?.type === 'LESS_THAN' || this.state.peek()?.type === 'LESS_THAN_OR_EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseAdditive()

            left = {
                type: 'ComparisonExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseAdditive(): any {
        let left: any = this.parseMultiplicative()

        while (this.state.peek()?.type === 'PLUS' || this.state.peek()?.type === 'MINUS') {
            const operator = this.state.advance().lexeme
            const right = this.parseMultiplicative()

            left = {
                type: 'ArithmeticExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseMultiplicative(): any {
        let left: any = this.parseUnary()

        while (this.state.peek()?.type === 'STAR' || this.state.peek()?.type === 'SLASH') {
            const operator = this.state.advance().lexeme
            const right = this.parseUnary()

            left = {
                type: 'ArithmeticExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseUnary(): any {
        let left: any = this.parsePrimary()

        while (this.state.peek()?.type === 'MINUS' || this.state.peek()?.type === 'NOT') {
            const operator = this.state.advance().lexeme
            const right = this.parseUnary()

            left = {
                type: 'UnaryExpression',
                operator, left, right
            }
        }

        return left
    }

    private parsePrimary(): any {
        if (this.state.peek()?.type === 'NUMBER_LITERAL') {
            return {
                type: 'NumberLiteral',
                value: this.state.advance().lexeme
            }
        } else if (this.state.peek()?.type === 'STRING_LITERAL') {
            return {
                type: 'StringLiteral',
                value: this.state.advance().lexeme
            }
        } else if (this.state.peek()?.type === 'BOOLEAN_LITERAL') {
            return {
                type: 'BooleanLiteral',
                value: this.state.advance().lexeme
            }
        } else if (this.state.peek()?.type === 'IDENTIFIER') {
            return {
                type: 'Identifier',
                name: this.state.advance().lexeme
            }
        } else if (this.state.peek()?.type === 'OPENING_PARENTHESIS') {
            this.state.increment()
            const node = this.parseExpression()
            this.state.expect('CLOSING_PARENTHESIS')

            return node
        }
    }

    private parseVariableDeclaration(): any {
        this.state.expect('KEYWORD_LET')

        const identifier = this.state.peek().lexeme
        let value: any = null
        
        this.state.expect('IDENTIFIER')

        if (this.state.peek().type === 'EQUALS') {
            this.state.increment()
            value = this.parseExpression()
        }

        this.state.expect('SEMI_COLON')

        return {
            type: 'VariableDeclaration',
            identifier, value
        }
    }
}