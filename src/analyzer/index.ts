import type { Node } from '../../types/nodes.d.ts'
import type { FunctionSymbol, MethodSymbol, PropertySymbol, Symbol } from '../../types/scope.ts'
import error from '../shared/error.ts'
import AnalyzerState from './state.ts'
import { ScopeStack } from '../shared/scope.ts'

export default class Analyzer {
    private state: AnalyzerState;
    private symbolTable: ScopeStack;
    private loopDepth: number = 0;
    private functionDepth: number = 0;

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
            case 'VariableDeclaration':
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
            } case 'FunctionDeclaration': {
                return this.analyzeFunctionDeclaration(node)
            } case 'ReturnStatement': {
                return this.analyzeReturnStatement(node)
            } case 'ClassDeclaration': {
                return this.analyzeClassDeclaration(node)
            } default: {
                return this.analyzeExpression(node)
            }
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
        const symbolType = node.type === 'ConstantDeclaration' ? 'constant' : 'variable'
        let dataType: string | null = 'any'
        let initialValue: any = undefined

        if (value.type === 'NumberLiteral') {
            dataType = 'number'
            initialValue = value.value
        } else if (value.type === 'StringLiteral') {
            dataType = 'string'
            initialValue = value.value
        }

        const symbol: Symbol = {
            type: symbolType,
            dataType,
            value: initialValue
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
    
    private analyzeClassDeclaration(node: Node) {
        this.symbolTable.storeClass(node.name.name)

        node.body?.forEach((element: Node) => {
            const classSymbol = this.symbolTable.get(node.name.name)

            switch (element.type) {
                case 'PropertyDeclaration': {
                    const property = {
                        type: 'variable',
                        accessModifier: element.accessModifier,
                        isStatic: element.isStatic,
                        dataType: 'any'
                    } as PropertySymbol

                    classSymbol.properties.set(element.name.name, property)
                    break
                } case 'MethodDeclaration': {
                    const method = {
                        type: 'function',
                        accessModifier: element.accessModifier,
                        isStatic: element.isStatic,
                        dataType: 'any',
                        arity: element.arguments.length,
                        entryPoint: -1,
                        returnType: 'any'
                    } as MethodSymbol

                    classSymbol.methods.set(element.name.name, method)
                    break
                } default: {
                    error(`Unexpected class member type: ${element.type}`)
                }
            }
        })

        console.log(this.symbolTable.get(node.name.name))

        return node
    }


    private analyzeExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
                return this.analyzeArthmeticExpression(node)
            } case 'CallExpression': {
                return this.analyzeCallExpression(node)
            } case 'ThisExpression': {
                console.log('Symbol Table:', this.symbolTable)
                break
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
            } case 'BooleanLiteral': {
                return node
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
                    if (right.type === 'StringLiteral') {
                        error(`Incompatible types for concatenation: ${left.type} and ${right.type}`)
                        return {
                            type: 'StringLiteral',
                            value: left.value + right.value
                        }
                    } else {
                        return node
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
            if (node?.arguments?.length && symbol.arity) {
                if (node?.arguments?.length !== symbol?.arity) {
                    error(`Expected ${symbol?.arity} parameters, but got ${node?.arguments?.length} instead`)
                }

                if (symbol?.type === 'function') {
                    node.arguments.map((args: any) => {
                        this.analyzeExpression(args)
                    })
                }
            }
        } else if (node.callee.type === 'MemberExpression') {
            // TODO
        }
        else {
            error(`Function name must be a valid identifier`)
        }
        return node
    }

    private analyzeFunctionDeclaration(node: Node) {
        this.symbolTable.storeUserDefinedFunction(node?.name?.name, node?.arguments?.length, 'any', 0)

        let counter = 0
        const bodyNodes = []
        
        this.functionDepth++

        while (node.body[counter]) {
            bodyNodes.push(this.analyzeStatement(node.body[counter]))
            counter++
        }

        this.functionDepth--

        return node
    }

    private analyzeReturnStatement(node: Node) {
        if (this.functionDepth === 0) {
            error(`Return statement outside functions is not allowed`)
        }

        return {
            type: 'ReturnStatement',
            expression: this.analyzeExpression(node.expression)
        }
    }
}