import error from '../shared/error.ts';
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
            } case 'KEYWORD_CONST': {
                return this.parseConstantDeclaration()
            } case 'KEYWORD_IF': {
                return this.parseIfStatement()
            } case 'OPENING_CURLY_BRACE': {
                return this.parseBlockStatement()
            } case 'KEYWORD_WHILE': {
                return this.parseWhileStatement()
            } case 'KEYWORD_BREAK': {
                return this.parseBreakStatement()
            } case 'KEYWORD_CONTINUE': {
                return this.parseContinueStatement()
            } case 'KEYWORD_DO': {
                return this.parseDoWhileStatement()
            } case 'KEYWORD_FOR': {
                return this.parseForStatement()
            } case 'KEYWORD_SWITCH': {
                return this.parseSwitchStatement()
            } case 'KEYWORD_FUNCTION': {
                return this.parseFunctionDeclaration()
            } case 'KEYWORD_RETURN': {
                return this.parseReturnStatement()
            } case 'KEYWORD_CLASS': {
                return this.parseClassDeclaration()
            } default: {
                const node = this.parseExpression()
                this.state.expect('SEMI_COLON')
                return node
            }
        }
    }

    private parseExpression(): any {
        return this.parseAssignment()
    }

    private parseAssignment(): any {
        let left = this.parseLogicalOr()

        while (this.state.peek()?.type === 'EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseAssignment()

            left = {
                type: 'AssignmentExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseLogicalOr(): any {
        let left: any = this.parseLogicalAnd()

        while (this.state.peek()?.type === 'OR') {
            const operator = this.state.advance().lexeme
            const right = this.parseLogicalAnd()

            left = {
                type: 'LogicalExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseLogicalAnd(): any {
        let left: any = this.parseEquality()

        while (this.state.peek()?.type === 'AND') {
            const operator = this.state.advance().lexeme
            const right = this.parseEquality()

            left = {
                type: 'LogicalExpression',
                operator, left, right
            }
        }

        return left
    }

    private parseEquality(): any {
        let left: any = this.parseComparison()

        while (this.state.peek()?.type === 'NOT_EQUALS' || this.state.peek()?.type === 'DOUBLE_EQUALS') {
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

        while (this.state.peek()?.type === 'STAR' || this.state.peek()?.type === 'SLASH' || this.state.peek()?.type === 'PERCENT') {
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
        if (this.state.peek()?.type === 'MINUS' || this.state.peek()?.type === 'NOT') {
            const operator = this.state.advance().lexeme
            const operand = this.parseUnary()
            
            return {
                type: 'UnaryExpression',
                operator, operand
            }
        }

        return this.parseCallExpression()
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

    private parseCallExpression(): any {
        let callee = this.parsePrimary()

        while (true) {
            if (this.state.peek()?.type === 'OPENING_PARENTHESIS') {
                const args: Array<any> = []
                this.state.increment()
                
                if (this.state.peek()?.type !== 'CLOSING_PARENTHESIS') {
                    args.push(this.parseExpression())
                    
                    while (this.state.peek()?.type === 'COMMA') {
                        this.state.expect('COMMA')
                        args.push(this.parseExpression())
                    }
                }

                this.state.expect('CLOSING_PARENTHESIS')

                callee = {
                    type: 'CallExpression',
                    callee, arguments: args
                }
            } else {
                break
            }
        }

        return callee
    }

    private parseVariableDeclaration(): any {
        this.state.expect('KEYWORD_LET')
        
        const name = this.state.peek().lexeme
        let value: any = null
        
        this.state.expect('IDENTIFIER')

        if (this.state.peek().type === 'EQUALS') {
            this.state.increment()
            value = this.parseExpression()
        }

        this.state.expect('SEMI_COLON')

        return {
            type: 'VariableDeclaration',
            name, value
        }
    }

    private parseConstantDeclaration(): any {
        this.state.expect('KEYWORD_CONST')

        const name = this.state.peek().lexeme

        this.state.expect('IDENTIFIER')
        this.state.expect('EQUALS')

        const value = this.parseExpression()

        this.state.expect('SEMI_COLON')

        return {
            type: 'ConstantDeclaration',
            name, value
        }
    }

    private parseBlockStatement() {
        let node = {
            type: 'BlockStatement',
            body: []
        }
        this.state.expect('OPENING_CURLY_BRACE')

        while (!this.state.isAtEnd() && this.state.peek()?.type !== 'CLOSING_CURLY_BRACE') {
            const stmt = this.parseStatement()

            if (stmt) {
                node.body.push(stmt)
            }
        }

        this.state.expect('CLOSING_CURLY_BRACE')
        return node
    }

    private parseIfStatement(): any {
        this.state.expect('KEYWORD_IF')

        const condition = this.parseExpression()
        const body = this.parseStatement()
        let alternate: any
        
        if (this.state.peek()?.type === 'KEYWORD_ELSE') {
            this.state.increment()
            alternate = this.parseStatement()
        } else {
            alternate = null
        }

        return {
            type: 'IfStatement',
            condition,
            consequent: body,
            alternate
        }
    }

    private parseSwitchStatement(): any {
        const node: any = {
            type: 'SwitchStatement',
            discriminant: null,
            cases: []

        }

        this.state.expect('KEYWORD_SWITCH')

        node.discriminant = this.parseExpression()

        this.state.expect('OPENING_CURLY_BRACE')

        while (this.state.peek().type === 'KEYWORD_CASE') {
            this.state.increment()

            const expr = this.parseExpression()
            const body = this.parseStatement()

            node.cases.push({
                type: 'CaseClause',
                test: expr,
                consequent: body
            })
        }

        if (this.state.peek().type === 'KEYWORD_DEFAULT') {
            this.state.increment()
            
            const body = this.parseStatement() 

            node.cases.push({
                type: 'CaseClause',
                test: null,
                consequent: body
            })
        }

        this.state.expect('CLOSING_CURLY_BRACE')
        return node
    }

    private parseWhileStatement(): any {
        this.state.expect('KEYWORD_WHILE')

        const condition = this.parseExpression()
        const body = this.parseStatement()

        return {
            type: 'WhileStatement',
            condition,
            body
        }
    }

    private parseBreakStatement(): any {
        this.state.expect('KEYWORD_BREAK')
        this.state.expect('SEMI_COLON')

        return { type: 'BreakStatement' }
    }

    private parseContinueStatement(): any {
        this.state.expect('KEYWORD_CONTINUE')
        this.state.expect('SEMI_COLON')

        return { type: 'ContinueStatement' }
    }

    private parseDoWhileStatement(): any {
        this.state.expect('KEYWORD_DO')

        const body = this.parseStatement()

        this.state.expect('KEYWORD_WHILE')

        const condition = this.parseExpression()

        this.state.expect('SEMI_COLON')

        return {
            type: 'DoWhileStatement',
            body,
            condition
        }
    }

    private parseForStatement(): any {
        this.state.expect('KEYWORD_FOR')

        const peek = this.state.peek()
        let initializer: any

        if (peek.type === 'KEYWORD_LET') {
            initializer = this.parseVariableDeclaration()
        } else if (peek.type === 'KEYWORD_CONST') {
            error(`Cannot declare constant iterator`)
        } else {
            initializer = this.parseAssignment()
        }

        const condition = this.parseExpression()

        this.state.expect('SEMI_COLON')

        const update = this.parseExpression()
        const body = this.parseStatement()

        return {
            type: 'ForStatement',
            initializer, condition, update, body
        }
    }

    private parseFunctionDeclaration(): any {
        this.state.expect('KEYWORD_FUNCTION')

        const name = {
            type: 'Identifier',
            name: this.state.peek().lexeme
        }
        const args: Array<any> = []

        this.state.expect('IDENTIFIER')
        this.state.expect('OPENING_PARENTHESIS')
        

        while (this.state.peek().type !== 'CLOSING_PARENTHESIS') {
            this.state.expect('IDENTIFIER')

            args.push({
                type: 'Identifier',
                name: this.state.peek(-1).lexeme
            })

            if (this.state.peek().type === 'COMMA') {
                this.state.increment()
            } else {
                break
            }
        }

        this.state.expect('CLOSING_PARENTHESIS')

        const body = this.parseBlockStatement()

        return {
            type: 'FunctionDeclaration',
            name,
            arguments: args,
            body
        }
    }

    private parseReturnStatement(): any {
        this.state.expect('KEYWORD_RETURN')

        const expression = this.parseExpression()

        this.state.expect('SEMI_COLON')

        return {
            type: 'ReturnStatement',
            expression
        }
    }

    private parseClassDeclaration(): any {
        this.state.expect('KEYWORD_CLASS')

        const name = {
            type: 'Identifier',
            name: this.state.peek().lexeme
        }
        let body: Array<any> = []
        let parent: any = {}

        this.state.expect('IDENTIFIER')

        if (this.state.peek().type === 'KEYWORD_INHERITS') {
            this.state.increment()

            parent = {
                type: 'Identifier',
                name: this.state.peek().lexeme
            }

            this.state.expect('IDENTIFIER')
        } else {
            parent = null
        }

        this.state.expect('OPENING_CURLY_BRACE')
        
        while (!this.state.isAtEnd() && this.state.peek().type !== 'CLOSING_CURLY_BRACE') {
            const maybeAccessModifier = this.state.peek()
            let accessModifier: string | null = null 

            if (maybeAccessModifier.type === 'KEYWORD_PUBLIC' || maybeAccessModifier.type === 'KEYWORD_PRIVATE') {
                accessModifier = maybeAccessModifier.lexeme
                this.state.increment()
            }

            const name = {
                type: 'Identifier',
                name: this.state.peek().lexeme
            }

            this.state.expect('IDENTIFIER')
            
            if (this.state.peek().type === 'EQUALS') {
                let value: any = null

                this.state.increment()

                value = this.parseExpression()

                this.state.expect('SEMI_COLON')
            
                const node = {
                    type: 'PropertyDeclaration',
                    accessModifier,
                    name, value
                }

                body.push(node)
            } else if (this.state.peek().type === 'OPENING_PARENTHESIS') {
                const args: Array<any> = []

                this.state.increment()

                while (this.state.peek().type !== 'CLOSING_PARENTHESIS') {
                    this.state.expect('IDENTIFIER')

                    args.push({
                        type: 'Identifier',
                        name: this.state.peek(-1).lexeme
                    })

                    if (this.state.peek().type === 'COMMA') {
                        this.state.increment()
                    } else {
                        break
                    }
                }

                this.state.expect('CLOSING_PARENTHESIS')

                const methodBody = this.parseBlockStatement()

                const node = {
                    type: 'MethodDeclaration',
                    accessModifier,
                    name,
                    arguments: args,
                    body: methodBody
                }

                body.push(node)
            }
        }

        this.state.expect('CLOSING_CURLY_BRACE')

        return {
            type: 'ClassDeclaration', 
            parent,
            name, body
        }
    }
}