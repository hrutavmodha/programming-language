import type {
    ConstantSymbol,
    FunctionSymbol,
    ScopeInterface,
    ScopeStackInterface,
    Symbol,
    VariableSymbol
} from '../../types/scope.d.ts'
import error from './error.ts'
import { nativeFunctions } from './native-functions.ts'

export class Scope {
    private symbols: ScopeInterface

    constructor() {
        this.symbols = new Map<string, Symbol>()
    }

    public store(variable: string, value: any) {
        if (this.symbols.has(variable)) {
            error(`Variable "${variable}" is already declared`)
        }

        this.symbols.set(variable, value)
    }

    public get(variable: string) {
        if (!this.symbols.has(variable)) {
            error(`Undefined variable "${variable}"`)
        }

        return this.symbols.get(variable)
    }


    public update(variable: string, value: any) {
        if (!this.symbols.has(variable)) {
            error(`Undefined variable "${variable}"`)
        }

        this.symbols.set(variable, value)
    }
}

export class ScopeStack {
    private scopeStack: ScopeStackInterface

    constructor() {
        this.scopeStack = []
    }

    push(scope: ScopeInterface) {
        this.scopeStack.push(scope)
    }

    pop() {
        return this.scopeStack.pop()
    }

    peek() {
        return this.scopeStack[this.scopeStack.length - 1]
    }

    get(name: string): any {
        const popped: ScopeInterface[] = []
        let value: any = undefined
        let isFound = false

        while (true) {
            const scope = this.pop()

            if (!scope) {
                break
            }
            popped.push(scope)

            if (scope.has(name)) {
                const symbol = scope.get(name)

                if (symbol.type === 'variable' || symbol.type === 'constant') {
                    value = (symbol as VariableSymbol | ConstantSymbol).dataType
                    isFound = true
                    break
                } else {
                    isFound = true
                    value = symbol
                }
            }
        }

        for (let i = popped.length - 1; i >= 0; i--) {
            const scopeToPush = popped[i]
            if (scopeToPush) {
                this.push(scopeToPush)
            }
        }

        if (!isFound) {
            error(`Undefined variable "${name}"`)
        }

        return value
    }

    storeConstant(name: string, value: any): void {
        const scope = this.pop()
        if (!scope) {
            error("No active scope")
        }

        if (scope.has(name)) {
            error(`Constant "${name}" is already declared`)
        }

        const symbol: Symbol = {
            type: 'constant',
            dataType: value
        }
        scope.set(name, symbol)
        this.push(scope)
    }

    storeFunction(name: string, arity: number, returnType: string): void {
        const symbol: FunctionSymbol = {
            type: 'function',
            arity,
            returnType
        }

        if (!this.scopeStack[0]) {
            this.scopeStack[0] = new Map<string, Symbol>()
        }

        this.scopeStack[0].set(name, symbol)
    }

    storeVariable(name: string, value: any): void {
        const scope = this.pop()
        if (!scope) {
            error("No active scope")
        }

        if (scope.has(name)) {
            error(`Variable "${name}" is already declared`)
        }
        const symbol: Symbol = {
            type: 'variable',
            dataType: value
        }
        scope.set(name, symbol)
        this.push(scope)
    }

    updateVariable(name: string, value: any): void {
        const popped: ScopeInterface[] = []
        let isFound = false

        while (true) {
            const scope = this.pop()

            if (!scope) {
                break
            }

            popped.push(scope)

            if (scope.has(name)) {

                const symbol = scope.get(name)
                isFound = true

                if (symbol.type === 'variable') {
                    (symbol as VariableSymbol).dataType = value
                    break
                } else if (symbol.type === 'constant') {
                    error(`Cannot re-assign the constant`)
                    break
                }
            }
        }

        for (let i = popped.length - 1; i >= 0; i--) {
            const scopeToPush = popped[i]
            if (scopeToPush) {
                this.push(scopeToPush)
            }
        }

        if (!isFound) {
            error(`Undefined variable "${name}"`)
        }
    }

    getScopeStack() {
        return this.scopeStack
    }
}