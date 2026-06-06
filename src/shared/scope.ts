import type {
    ScopeInterface,
    ScopeStackInterface,
    Symbol
} from '../../types/scope.d.ts'
import error from './error.ts'

export class Scope {
    private symbols: ScopeInterface

    constructor() {
        this.symbols = new Map<string, Symbol>()
    }

    public store(variable: string, value: any) {
        console.log("Symbols are:", this.symbols)
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
        this.scopeStack = new Array<ScopeInterface>()
    }

    public push(scope: ScopeInterface) {
        this.scopeStack.push(scope)
    }

    public pop() {
        return this.scopeStack.pop()
    }
}