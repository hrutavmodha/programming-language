import type { Node } from '../../types/nodes.d.ts'
import type { Symbol } from '../../types/scope.ts'
import error from '../shared/error.ts'
import AnalyzerState from './state.ts'
import { ScopeStack } from '../shared/scope.ts'

export default class Analyzer {
    private state: AnalyzerState;
    private symbolTable: ScopeStack;

    constructor(state: AnalyzerState) {
        this.state = state
        this.symbolTable = new ScopeStack()
        this.symbolTable.push(new Map<string, Symbol>())
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
                return {
                    type: 'PrintStatement',
                    arguments: this.analyzeExpression(node.arguments)
                }
            } case 'VariableDeclaration': {
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
                break
            } default: {
                return this.analyzeExpression(node)
            }
        }
    }

    private analyzeExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
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
}