import error from '../shared/error.ts';
import ParserState from './state.ts';
import type { Token } from '../../types/tokens.d.ts';

export default class Parser {
    private state: ParserState;

    constructor(state: ParserState) {
        this.state = state
    }

    private withLocation(startToken: Token | undefined, node: any): any {
        if (!node) return node
        const endToken = this.state.peek(-1)
        
        const start = startToken?.index ?? 0
        const end = endToken ? ((endToken.index ?? start) + (endToken.length ?? 0)) : start
        const length = end - start

        node.row = startToken?.row ?? 0
        node.column = startToken?.column ?? 0
        node.length = length

        return node
    }

    parse(): any {
        const startToken = this.state.peek(0)
        const start = startToken?.index ?? 0
        while (!this.state.isAtEnd()) {
            this.state.push(this.parseStatement())
        }

        const ast = this.state.getAst()
        const endToken = this.state.peek(-1) || this.state.peek(0)
        const end = endToken ? ((endToken.index ?? start) + (endToken.length ?? 0)) : start
        ast.row = startToken?.row ?? 0
        ast.column = startToken?.column ?? 0
        ast.length = end - start
        return ast
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
            } case 'KEYWORD_ATTEMPT': {
                return this.parseAttemptStatement()
            } default: {
                const node = this.parseExpression()
                this.state.expect(';')
                return node
            }
        }
    }

    private parseExpression(): any {
        return this.parseAssignment()
    }

    private parseAssignment(): any {
        const startToken = this.state.peek()
        let left = this.parseLogicalOr()

        while (this.state.peek()?.type === 'EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseAssignment()

            left = this.withLocation(startToken, {
                type: 'AssignmentExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseLogicalOr(): any {
        const startToken = this.state.peek()
        let left: any = this.parseLogicalAnd()

        while (this.state.peek()?.type === 'OR') {
            const operator = this.state.advance().lexeme
            const right = this.parseLogicalAnd()

            left = this.withLocation(startToken, {
                type: 'LogicalExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseLogicalAnd(): any {
        const startToken = this.state.peek()
        let left: any = this.parseEquality()

        while (this.state.peek()?.type === 'AND') {
            const operator = this.state.advance().lexeme
            const right = this.parseEquality()

            left = this.withLocation(startToken, {
                type: 'LogicalExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseEquality(): any {
        const startToken = this.state.peek()
        let left: any = this.parseComparison()

        while (this.state.peek()?.type === 'NOT_EQUALS' || this.state.peek()?.type === 'DOUBLE_EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseComparison()

            left = this.withLocation(startToken, {
                type: 'ComparisonExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseComparison(): any {
        const startToken = this.state.peek()
        let left: any = this.parseAdditive()

        while (this.state.peek()?.type === 'GREATER_THAN' || this.state.peek()?.type === 'GREATER_THAN_OR_EQUALS' || this.state.peek()?.type === 'LESS_THAN' || this.state.peek()?.type === 'LESS_THAN_OR_EQUALS') {
            const operator = this.state.advance().lexeme
            const right = this.parseAdditive()

            left = this.withLocation(startToken, {
                type: 'ComparisonExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseAdditive(): any {
        const startToken = this.state.peek()
        let left: any = this.parseMultiplicative()

        while (this.state.peek()?.type === 'PLUS' || this.state.peek()?.type === 'MINUS') {
            const operator = this.state.advance().lexeme
            const right = this.parseMultiplicative()

            left = this.withLocation(startToken, {
                type: 'ArithmeticExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseMultiplicative(): any {
        const startToken = this.state.peek()
        let left: any = this.parseUnary()

        while (this.state.peek()?.type === 'STAR' || this.state.peek()?.type === 'SLASH' || this.state.peek()?.type === 'PERCENT') {
            const operator = this.state.advance().lexeme
            const right = this.parseUnary()

            left = this.withLocation(startToken, {
                type: 'ArithmeticExpression',
                operator, left, right
            })
        }

        return left
    }

    private parseUnary(): any {
        const startToken = this.state.peek()
        if (this.state.peek()?.type === 'MINUS' || this.state.peek()?.type === 'NOT') {
            const operator = this.state.advance().lexeme
            const operand = this.parseUnary()
            
            return this.withLocation(startToken, {
                type: 'UnaryExpression',
                operator, operand
            })
        }

        return this.parseCallExpression()
    }

    private parsePrimary(): any {
        const startToken = this.state.peek()
        if (this.state.peek()?.type === 'NUMBER_LITERAL') {
            return this.withLocation(startToken, {
                type: 'NumberLiteral',
                value: this.state.advance().lexeme
            })
        } else if (this.state.peek()?.type === 'STRING_LITERAL') {
            return this.withLocation(startToken, {
                type: 'StringLiteral',
                value: this.state.advance().lexeme
            })
        } else if (this.state.peek()?.type === 'BOOLEAN_LITERAL') {
            return this.withLocation(startToken, {
                type: 'BooleanLiteral',
                value: this.state.advance().lexeme
            })
        } else if (this.state.peek()?.type === 'KEYWORD_THIS') {
            this.state.increment()
            return this.withLocation(startToken, { type: 'ThisExpression' })
        } else if (this.state.peek()?.type === 'IDENTIFIER') {
            return this.withLocation(startToken, {
                type: 'Identifier',
                name: this.state.advance().lexeme
            })
        } else if (this.state.peek()?.type === 'OPENING_PARENTHESIS') {
            this.state.increment()
            const node = this.parseExpression()
            this.state.expect(')')

            return node
        }
    }

    private parseCallExpression(): any {
        const startToken = this.state.peek()
        let callee = this.parsePrimary()

        while (true) {
            if (this.state.peek()?.type === 'OPENING_PARENTHESIS') {
                const args: Array<any> = []
                this.state.increment()
                
                if (this.state.peek()?.type !== 'CLOSING_PARENTHESIS') {
                    args.push(this.parseExpression())
                    
                    while (this.state.peek()?.type === 'COMMA') {
                        this.state.expect(',')
                        args.push(this.parseExpression())
                    }
                }

                this.state.expect(')')

                callee = this.withLocation(startToken, {
                    type: 'CallExpression',
                    callee, arguments: args
                })
            } else if (this.state.peek()?.type === 'DOT') {
                this.state.increment()
                
                const name = this.state.peek().lexeme

                this.state.expect('IDENTIFIER')

                callee = this.withLocation(startToken, {
                    type: 'MemberExpression',
                    object: callee,
                    property: this.withLocation(this.state.peek(-1), {
                        type: 'Identifier',
                        name
                    })
                })
            } else {
                break
            }
        }

        return callee
    }

    private parseVariableDeclaration(): any {
        const startToken = this.state.peek()
        this.state.expect('let')
        
        const name = this.state.peek().lexeme
        let value: any = null
        
        this.state.expect('IDENTIFIER')

        if (this.state.peek().type === 'EQUALS') {
            this.state.increment()
            value = this.parseExpression()
        }

        this.state.expect(';')

        return this.withLocation(startToken, {
            type: 'VariableDeclaration',
            name, value
        })
    }

    private parseConstantDeclaration(): any {
        const startToken = this.state.peek()
        this.state.expect('const')

        const name = this.state.peek().lexeme

        this.state.expect('IDENTIFIER')
        this.state.expect('=')

        const value = this.parseExpression()

        this.state.expect(';')

        return this.withLocation(startToken, {
            type: 'ConstantDeclaration',
            name, value
        })
    }

    private parseBlockStatement() {
        const startToken = this.state.peek()
        let node = {
            type: 'BlockStatement',
            body: []
        }
        this.state.expect('{')

        while (!this.state.isAtEnd() && this.state.peek()?.type !== 'CLOSING_CURLY_BRACE') {
            const stmt = this.parseStatement()

            if (stmt) {
                node.body.push(stmt)
            }
        }

        this.state.expect('}')
        return this.withLocation(startToken, node)
    }

    private parseIfStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('if')

        const condition = this.parseExpression()
        const body = this.parseStatement()
        let alternate: any
        
        if (this.state.peek()?.type === 'KEYWORD_ELSE') {
            this.state.increment()
            alternate = this.parseStatement()
        } else {
            alternate = null
        }

        return this.withLocation(startToken, {
            type: 'IfStatement',
            condition,
            consequent: body,
            alternate
        })
    }

    private parseSwitchStatement(): any {
        const startToken = this.state.peek()
        const node: any = {
            type: 'SwitchStatement',
            discriminant: null,
            cases: []
        }

        this.state.expect('switch')

        node.discriminant = this.parseExpression()

        this.state.expect('{')

        while (this.state.peek().type === 'KEYWORD_CASE') {
            const caseStartToken = this.state.peek()
            this.state.increment()

            const expr = this.parseExpression()
            const body = this.parseStatement()

            node.cases.push(this.withLocation(caseStartToken, {
                type: 'CaseClause',
                test: expr,
                consequent: body
            }))
        }

        if (this.state.peek().type === 'KEYWORD_DEFAULT') {
            const defaultStartToken = this.state.peek()
            this.state.increment()
            
            const body = this.parseStatement() 

            node.cases.push(this.withLocation(defaultStartToken, {
                type: 'CaseClause',
                test: null,
                consequent: body
            }))
        }

        this.state.expect('}')
        return this.withLocation(startToken, node)
    }

    private parseWhileStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('while')

        const condition = this.parseExpression()
        const body = this.parseStatement()

        return this.withLocation(startToken, {
            type: 'WhileStatement',
            condition,
            body
        })
    }

    private parseBreakStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('break')
        this.state.expect(';')

        return this.withLocation(startToken, { type: 'BreakStatement' })
    }

    private parseContinueStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('continue')
        this.state.expect(';')

        return this.withLocation(startToken, { type: 'ContinueStatement' })
    }

    private parseDoWhileStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('do')

        const body = this.parseStatement()

        this.state.expect('while')

        const condition = this.parseExpression()

        this.state.expect(';')

        return this.withLocation(startToken, {
            type: 'DoWhileStatement',
            body,
            condition
        })
    }

    private parseForStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('for')

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

        this.state.expect(';')

        const update = this.parseExpression()
        const body = this.parseStatement()

        return this.withLocation(startToken, {
            type: 'ForStatement',
            initializer, condition, update, body
        })
    }

    private parseFunctionDeclaration(): any {
        const startToken = this.state.peek()
        this.state.expect('function')

        const name = this.withLocation(this.state.peek(), {
            type: 'Identifier',
            name: this.state.peek().lexeme
        })
        const args: Array<any> = []

        this.state.expect('IDENTIFIER')
        this.state.expect('(')
        

        while (this.state.peek().type !== 'CLOSING_PARENTHESIS') {
            this.state.expect('IDENTIFIER')

            args.push(this.withLocation(this.state.peek(-1), {
                type: 'Identifier',
                name: this.state.peek(-1).lexeme
            }))

            if (this.state.peek().type === 'COMMA') {
                this.state.increment()
            } else {
                break
            }
        }

        this.state.expect(')')

        const body = this.parseBlockStatement()

        return this.withLocation(startToken, {
            type: 'FunctionDeclaration',
            name,
            arguments: args,
            body
        })
    }

    private parseReturnStatement(): any {
        const startToken = this.state.peek()
        this.state.expect('return')

        const expression = this.parseExpression()

        this.state.expect(';')

        return this.withLocation(startToken, {
            type: 'ReturnStatement',
            expression
        })
    }

    private parseClassDeclaration(): any {
        const startToken = this.state.peek()
        this.state.expect('class')

        const name = this.withLocation(this.state.peek(), {
            type: 'Identifier',
            name: this.state.peek().lexeme
        })
        let body: Array<any> = []
        let parent: any = {}

        this.state.expect('IDENTIFIER')

        if (this.state.peek().type === 'KEYWORD_INHERITS') {
            this.state.increment()

            parent = this.withLocation(this.state.peek(), {
                type: 'Identifier',
                name: this.state.peek().lexeme
            })

            this.state.expect('IDENTIFIER')
        } else {
            parent = null
        }

        this.state.expect('{')
        
        while (!this.state.isAtEnd() && this.state.peek().type !== 'CLOSING_CURLY_BRACE') {
            const memberStartToken = this.state.peek()
            const maybeAccessModifier = this.state.peek()
            let accessModifier: string | null = null 
            let isStatic: boolean = false

            if (maybeAccessModifier.type === 'KEYWORD_PUBLIC' || maybeAccessModifier.type === 'KEYWORD_PRIVATE') {
                accessModifier = maybeAccessModifier.lexeme
                this.state.increment()
            } if (this.state.peek().type === 'KEYWORD_STATIC') {
                isStatic = true
                this.state.increment()
            }

            const memberName = this.withLocation(this.state.peek(), {
                type: 'Identifier',
                name: this.state.peek().lexeme
            })

            this.state.expect('IDENTIFIER')
            
            if (this.state.peek().type === 'EQUALS') {
                let value: any = null

                this.state.increment()

                value = this.parseExpression()

                this.state.expect(';')
            
                const node = this.withLocation(memberStartToken, {
                    type: 'PropertyDeclaration',
                    accessModifier,
                    isStatic, name: memberName, value
                })

                body.push(node)
            } else if (this.state.peek().type === 'OPENING_PARENTHESIS') {
                const args: Array<any> = []

                this.state.increment()

                while (this.state.peek().type !== 'CLOSING_PARENTHESIS') {
                    this.state.expect('IDENTIFIER')

                    args.push(this.withLocation(this.state.peek(-1), {
                        type: 'Identifier',
                        name: this.state.peek(-1).lexeme
                    }))

                    if (this.state.peek().type === 'COMMA') {
                        this.state.increment()
                    } else {
                        break
                    }
                }

                this.state.expect(')')

                const methodBody = this.parseBlockStatement()

                const node = this.withLocation(memberStartToken, {
                    type: 'MethodDeclaration',
                    accessModifier, 
                    isStatic,
                    name: memberName,
                    arguments: args,
                    body: methodBody
                })

                body.push(node)
            }
        }

        this.state.expect('}')

        return this.withLocation(startToken, {
            type: 'ClassDeclaration', 
            parent,
            name, body
        })
    }

    private parseAttemptStatement() {
        const node: any = {
            type: 'AttemptStatement',
            body: [],
            accept: [],
            lastly: null
        }
        this.state.expect('attempt')

        node.body = this.parseBlockStatement()

        if (this.state.peek().lexeme !== 'accept') {
            node.accept = null
        }

        while (this.state.peek().lexeme === 'accept') {
            this.state.increment()
            const errorName = this.parsePrimary()
            const errorBody = this.parseBlockStatement()
            
            node.accept.push({
                type: 'AcceptStatement',
                errorName,
                body: errorBody
            })
        }

        if (this.state.peek().lexeme === 'lastly') {
            this.state.increment()

            node.lastly = this.parseBlockStatement()
        }

        return node
    }
}