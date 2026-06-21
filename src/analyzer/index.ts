import type { Node } from '../../types/nodes.d.ts'
import type { FunctionSymbol, MethodSymbol, PropertySymbol, Symbol } from '../../types/scope.ts'
import error from '../shared/error.ts'
import AnalyzerState from './state.ts'
import { ScopeStack } from '../shared/scope.ts'
import { time } from 'console'

export default class Analyzer {
    private state: AnalyzerState;
    private symbolTable: ScopeStack;
    private loopDepth: number = 0;
    private functionDepth: number = 0;
    private currentClass: string = '';

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
        } else if (value.type === 'CallExpression') {
            dataType = value.callee.name
            initialValue = null
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
        const prevClass = this.currentClass
        this.currentClass = node.name.name

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

        this.currentClass = prevClass

        return node
    }


    private analyzeExpression(node: Node) {
        switch (node.type) {
            case 'ArithmeticExpression': {
                return this.analyzeArthmeticExpression(node)
            } case 'CallExpression': {
                return this.analyzeCallExpression(node)
            } case 'ThisExpression': {
                break
            } case 'MemberExpression': {
                return this.analyzeMemberExpression(node)
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
            let symbol = this.symbolTable.get(node.callee.name) as any
            if (symbol && (symbol.type === 'variable' || symbol.type === 'constant')) {
                symbol = symbol.value
            }

            if (symbol && node?.arguments?.length && symbol.arity) {
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
            return this.analyzeMemberExpression(node.callee)
        } else {
            error(`Function name must be a valid identifier`)
        }

        return node
    }

    private analyzeMemberExpression(node: Node) {
        const symbol = this.symbolTable.get(node.object.name)
        let blueprint: any

        if (symbol.dataType) {
            blueprint = this.symbolTable.get(symbol.dataType)
        } else {
            blueprint = symbol
        }
        
        const checkOnMethods =
            blueprint.methods.has(node.property.name) &&
            // !blueprint.methods.get(node.property.name).isStatic &&
            blueprint.methods.get(node.property.name).accessModifier !== 'private'
        
        const checkOnProperties =
            blueprint.properties.has(node.property.name) &&
            // !blueprint.properties.get(node.property.name).isStatic &&
            blueprint.properties.get(node.property.name).accessModifier !== 'private'
        
        if (checkOnMethods || checkOnProperties) {
            return node
        } else {
            error('Cannot access an invalid class member')
        }
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