import type { Node } from '../../types/nodes.d.ts'
import type { FunctionSymbol, Symbol } from '../../types/scope.ts'
import error from '../shared/error.ts'
import AnalyzerState from './state.ts'
import { ScopeStack } from '../shared/scope.ts'

export default class Analyzer {
    private state: AnalyzerState;
    private symbolTable: ScopeStack;
    private loopDepth: number = 0

    constructor(state: AnalyzerState) {
        this.state = state
        this.symbolTable = state.scopeStack
    }

    getSymbolTable() {
        return this.symbolTable
    }

    analyze() {
        while (!this.state.isAtEnd()) {
            this.state.push(this.analyzeStatement(this.state.peek()))
            this.state.increment()
        }

        return this.state.getAnalyzedAst()
    }

    private analyzeStatement(node: Node): any {
        switch (node.type) {
            case 'PrintStatement': {
                return this.analyzePrintStatement(node)
            } case 'VariableDeclaration':
            case 'ConstantDeclaration': {
                return this.analyzeVariableDeclaration(node)
            } case 'IfStatement': {
                return this.analyzeIfStatement(node)
            } case 'WhileStatement': {
                return this.analyzeWhileStatement(node)
            } case 'BreakStatement': {
                return this.analyzeBreakStatement(node)
            } case 'ContinueStatement': {
                return this.analyzeContinueStatement(node)
            } default: {
                return this.analyzeExpression(node)
            }
        }
    }

    private analyzePrintStatement(node: Node) {
        return {
            type: 'PrintStatement',
            arguments: this.analyzeExpression(node.arguments)
        }
    }

    private analyzeVariableDeclaration(node: Node) {
        const value = this.analyzeExpression(node.value)
        const currentScope = this.symbolTable.pop()
        if (!currentScope) {
            error("No active scope")
        }
        if (currentScope.has(node.name)) {
            error(`Variable "${node.name}" is already declared`)
        }
        const dataType = (value.type === 'NumberLiteral' || value.type === 'StringLiteral') ? value.value : null
        const symbol: Symbol = {
            type: 'variable',
            dataType
        }
        currentScope.set(node.name, symbol)
        this.symbolTable.push(currentScope)
        return node
    }

    private analyzeIfStatement(node: Node) {
        // TODO
        return node
    }

    private analyzeWhileStatement(node: Node) { 
        this.loopDepth++

        const condition = this.analyzeExpression(node.condition)
        const consequent = this.analyzeStatement(node.body)

        this.loopDepth--
        return {
            type: 'WhileStatement',
            condition, body: consequent
        }
    }

    private analyzeBreakStatement(node: Node) {
        if (this.loopDepth === 0) {
            error(`"break" outside loop is not allowed`)
        }

        return node
    }

    private analyzeContinueStatement(node: Node) {
        if (this.loopDepth === 0) {
            error(`"continue" outside loop is not allowed`)
        }

        return node
    }

    private analyzeExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
                return this.analyzeArthmeticExpression(node)
            } case 'CallExpression': {
                return this.analyzeCallExpression(node)
            } case 'NumberLiteral': {
                return {
                    type: 'NumberLiteral',
                    value: parseFloat(node.value)
                }
            } case 'StringLiteral': {
                return {
                    type: 'StringLiteral',
                    value: String(node.value)
                }
            } case 'Identifier': {
                return {
                    type: 'Identifier',
                    name: node.name
                }
            }
        }
    }

    private analyzeArthmeticExpression(node: Node) {
        let left = this.analyzeExpression(node.left)
        let right = this.analyzeExpression(node.right)

        switch (node.operator) {
            case '+': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        error(`Incompatible types for addition: ${left.type} and ${right.type}`)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value + right.value
                    }
                } else if (left.type === 'StringLiteral') {
                    if (right.type !== 'StringLiteral') {
                        error(`Incompatible types for concatenation: ${left.type} and ${right.type}`)
                    } return {
                        type: 'StringLiteral',
                        value: left.value + right.value
                    }
                } else if (left.type === 'Identifier' || right.type === 'Identifier') {
                    return {
                        type: 'ArithmeticExpression',
                        operator: node.operator,
                        left, right
                    }
                } else {
                    error(`Incompatible type for operator "+": ${left.type}`)
                }
                break
            } case '-': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        error(`Incompatible types for addition: ${left.type} and ${right.type}`)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value - right.value
                    }
                } else {
                    error(`Incompatible type for operator "+": ${left.type}`)
                }
                break
            } case '*': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        error(`Incompatible types for addition: ${left.type} and ${right.type}`)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value * right.value
                    }
                } else {
                    error(`Incompatible type for operator "+": ${left.type}`)
                }
                break
            } case '/': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        error(`Incompatible types for addition: ${left.type} and ${right.type}`)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value / right.value
                    }
                } else {
                    error(`Incompatible type for operator "+": ${left.type}`)
                }
                break
            } default: {
                return {
                    type: 'ArithmeticExpression',
                    operator: node.operator,
                    left, right
                }
            }
        }
    }

    private analyzeCallExpression(node: Node) {
        if (node.callee.type === 'Identifier') {
            const symbol = this.symbolTable.get(node.callee.name) as FunctionSymbol

            if (node?.arguments?.length !== symbol?.arity) {
                error(`Expected ${symbol?.arity} parameters, but got ${node?.arguments?.length} instead`)
            }

            if (symbol?.type === 'function') {
                node.arguments.map((args: any) => {
                    this.analyzeExpression(args)
                })
            }
        } else {
            console.log(`Function name must be a valid identifier`)
        }
        return node
    }
}