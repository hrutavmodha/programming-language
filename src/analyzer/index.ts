import type { Node } from '../../types/nodes.d.ts'
import type { FunctionSymbol, MethodSymbol, PropertySymbol, Symbol } from '../../types/scope.ts'
import AnalyzerState from './state.ts'
import { ScopeStack } from '../shared/scope.ts'

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
            } case 'DoWhileStatement': {
                return this.analyzeDoWhileStatement(node)
            } case 'ForStatement': {
                return this.analyzeForStatement(node)
            } case 'SwitchStatement': {
                return this.analyzeSwitchStatement(node)
            } case 'BlockStatement': {
                return this.analyzeBlockStatement(node)
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
            this.state.reportError("No active scope", node)
        }
        
        if (currentScope && currentScope.has(node.name)) {
            this.state.reportError(`Variable "${node.name}" is already declared`, node)
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
        if (currentScope) {
            currentScope.set(node.name, symbol)
            this.symbolTable.push(currentScope)
        }

        return {
            ...node,
            value
        }
    }

    private analyzeIfStatement(node: Node) {
        const condition = this.analyzeExpression(node.condition)
        const consequent = this.analyzeStatement(node.consequent)
        const alternate = node.alternate ? this.analyzeStatement(node.alternate) : null
        return {
            ...node,
            condition,
            consequent,
            alternate
        }
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

    private analyzeDoWhileStatement(node: Node) {
        this.loopDepth++

        const body = this.analyzeStatement(node.body)
        const condition = this.analyzeExpression(node.condition)
        
        this.loopDepth--
        
        return {
            ...node,
            body,
            condition
        }
    }

    private analyzeForStatement(node: Node) {
        this.loopDepth++
        const initializer = node.initializer ? this.analyzeStatement(node.initializer) : null
        const condition = node.condition ? this.analyzeExpression(node.condition) : null
        const update = node.update ? this.analyzeExpression(node.update) : null
        const body = this.analyzeStatement(node.body)
        this.loopDepth--
        return {
            ...node,
            initializer,
            condition,
            update,
            body
        }
    }

    private analyzeSwitchStatement(node: Node) {
        const discriminant = this.analyzeExpression(node.discriminant)
        const cases = node.cases.map((c: any) => {
            const test = c.test ? this.analyzeExpression(c.test) : null
            const consequent = this.analyzeStatement(c.consequent)
            return {
                ...c,
                test,
                consequent
            }
        })
        return {
            ...node,
            discriminant,
            cases
        }
    }

    private analyzeBlockStatement(node: Node) {
        const body = node.body.map((stmt: Node) => this.analyzeStatement(stmt))
        return {
            ...node,
            body
        }
    }

    private analyzeBreakStatement(node: Node) {
        if (this.loopDepth === 0) {
            this.state.reportError(`"break" outside loop is not allowed`, node)
        }
        
        return node
    }
    
    private analyzeContinueStatement(node: Node) {
        if (this.loopDepth === 0) {
            this.state.reportError(`"continue" outside loop is not allowed`, node)
        }
        
        return node
    }
    
    private analyzeClassDeclaration(node: Node) {
        const prevClass = this.currentClass
        this.currentClass = node.name.name

        this.symbolTable.storeClass(node.name.name)

        node.body?.forEach((element: Node) => {
            const classSymbol = this.symbolTable.get(node.name.name) as any

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
                    this.state.reportError(`Unexpected class member type: ${element.type}`, element)
                }
            }
        })

        this.currentClass = prevClass

        return node
    }

    private analyzeExpression(node: Node): any {
        switch (node.type) {
            case 'ArithmeticExpression': {
                return this.analyzeArthmeticExpression(node)
            } case 'ComparisonExpression':
              case 'LogicalExpression': {
                const left = this.analyzeExpression(node.left)
                const right = this.analyzeExpression(node.right)
                return {
                    ...node,
                    left,
                    right
                }
            } case 'UnaryExpression': {
                const argument = this.analyzeExpression(node.argument)
                return {
                    ...node,
                    argument
                }
            } case 'AssignmentExpression': {
                let left = node.left
                const right = this.analyzeExpression(node.right)
                if (left.type === 'Identifier') {
                    if (!this.symbolTable.has(left.name)) {
                        this.state.reportError(`Undefined variable "${left.name}"`, left)
                    } else {
                        const symbol = this.symbolTable.get(left.name)
                        if (symbol && symbol.type === 'constant') {
                            this.state.reportError(`Cannot re-assign the constant "${left.name}"`, node)
                        }
                    }
                } else if (left.type === 'MemberExpression') {
                    left = this.analyzeMemberExpression(left)
                } else {
                    this.state.reportError(`Invalid left-hand side in assignment`, left)
                }
                return {
                    ...node,
                    left,
                    right
                }
            } case 'CallExpression': {
                return this.analyzeCallExpression(node)
            } case 'ThisExpression': {
                return node
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
                if (!this.symbolTable.has(node.name)) {
                    this.state.reportError(`Undefined variable "${node.name}"`, node)
                }
                return node
            } case 'BooleanLiteral': {
                return node
            } default: {
                return node
            }
        }
    }

    private analyzeArthmeticExpression(node: Node): any {
        let left = this.analyzeExpression(node.left)
        let right = this.analyzeExpression(node.right)

        switch (node.operator) {
            case '+': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        this.state.reportError(`Incompatible types for addition: ${left.type} and ${right.type}`, node)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value + right.value
                    }
                } else if (left.type === 'StringLiteral') {
                    if (right.type === 'StringLiteral') {
                        this.state.reportError(`Incompatible types for concatenation: ${left.type} and ${right.type}`, node)
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
                    this.state.reportError(`Incompatible type for operator "+": ${left.type}`, node)
                }
                break
            } case '-': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        this.state.reportError(`Incompatible types for operator "-": ${left.type} and ${right.type}`, node)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value - right.value
                    }
                } else if (left.type === 'Identifier' || right.type === 'Identifier') {
                    return {
                        type: 'ArithmeticExpression',
                        operator: node.operator,
                        left, right
                    }
                } else {
                    this.state.reportError(`Incompatible type for operator "-": ${left.type}`, node)
                }
                break
            } case '*': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        this.state.reportError(`Incompatible types for operator "*": ${left.type} and ${right.type}`, node)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value * right.value
                    }
                } else if (left.type === 'Identifier' || right.type === 'Identifier') {
                    return {
                        type: 'ArithmeticExpression',
                        operator: node.operator,
                        left, right
                    }
                } else {
                    this.state.reportError(`Incompatible type for operator "*": ${left.type}`, node)
                }
                break
            } case '/': {
                if (left.type === 'NumberLiteral') {
                    if (right.type !== 'NumberLiteral') {
                        this.state.reportError(`Incompatible types for operator "/": ${left.type} and ${right.type}`, node)
                    } return {
                        type: 'NumberLiteral',
                        value: left.value / right.value
                    }
                } else if (left.type === 'Identifier' || right.type === 'Identifier') {
                    return {
                        type: 'ArithmeticExpression',
                        operator: node.operator,
                        left, right
                    }
                } else {
                    this.state.reportError(`Incompatible type for operator "/": ${left.type}`, node)
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
        let analyzedCallee = node.callee
        if (node.callee.type === 'Identifier') {
            if (!this.symbolTable.has(node.callee.name)) {
                this.state.reportError(`Undefined variable "${node.callee.name}"`, node.callee)
            } else {
                let symbol = this.symbolTable.get(node.callee.name) as any
                if (symbol && (symbol.type === 'variable' || symbol.type === 'constant')) {
                    symbol = symbol.value
                }

                if (symbol && node.arguments && symbol.arity !== undefined) {
                    if (node.arguments.length !== symbol.arity) {
                        this.state.reportError(`Expected ${symbol.arity} parameters, but got ${node.arguments.length} instead`, node)
                    }
                }
            }
        } else if (node.callee.type === 'MemberExpression') {
            analyzedCallee = this.analyzeMemberExpression(node.callee)
        } else {
            this.state.reportError(`Function name must be a valid identifier`, node)
        }

        const analyzedArgs = node.arguments ? node.arguments.map((arg: any) => this.analyzeExpression(arg)) : []

        return {
            ...node,
            callee: analyzedCallee,
            arguments: analyzedArgs
        }
    }

    private analyzeMemberExpression(node: Node) {
        if (!this.symbolTable.has(node.object.name)) {
            this.state.reportError(`Undefined variable "${node.object.name}"`, node.object)
            return node
        }

        const symbol = this.symbolTable.get(node.object.name) as any
        let blueprint: any

        if (symbol.dataType) {
            if (!this.symbolTable.has(symbol.dataType)) {
                this.state.reportError(`Undefined class "${symbol.dataType}"`, node)
                return node
            }
            blueprint = this.symbolTable.get(symbol.dataType)
        } else {
            blueprint = symbol
        }
        
        if (!blueprint || (!blueprint.methods && !blueprint.properties)) {
            this.state.reportError(`Object "${node.object.name}" is not a class instance or class`, node)
            return node
        }

        const checkOnMethods =
            blueprint.methods && blueprint.methods.has(node.property.name) &&
            blueprint.methods.get(node.property.name).accessModifier !== 'private'
        
        const checkOnProperties =
            blueprint.properties && blueprint.properties.has(node.property.name) &&
            blueprint.properties.get(node.property.name).accessModifier !== 'private'
        
        if (checkOnMethods || checkOnProperties) {
            return node
        } else {
            this.state.reportError('Cannot access an invalid class member', node)
            return node
        }
    }

    private analyzeFunctionDeclaration(node: Node) {
        this.symbolTable.storeUserDefinedFunction(node?.name?.name, node?.arguments?.length, 'any', 0)

        this.functionDepth++

        const functionScope = new Map<string, Symbol>()
        node.arguments.forEach((arg: any) => {
            functionScope.set(arg.name, {
                type: 'variable',
                dataType: 'any',
                value: undefined
            })
        })
        
        this.symbolTable.push(functionScope)

        const bodyNodes = []
        let counter = 0
        while (node.body.body[counter]) {
            const stmt = node.body.body[counter]
            if (stmt.type === 'FunctionDeclaration') {
                console.log('Closure detected')
            }
            bodyNodes.push(this.analyzeStatement(stmt))   
            counter++
        }

        this.symbolTable.pop()
        this.functionDepth--

        return {
            ...node,
            body: {
                ...node.body,
                body: bodyNodes
            }
        }
    }

    private analyzeReturnStatement(node: Node) {
        if (this.functionDepth === 0) {
            this.state.reportError(`Return statement outside functions is not allowed`, node)
        }

        return {
            type: 'ReturnStatement',
            expression: this.analyzeExpression(node.expression)
        }
    }
}