import type {
        ClassSymbol,
        ConstantSymbol,
        FunctionSymbol,
        PropertySymbol,
        ScopeInterface,
        ScopeStackInterface,
        Symbol,
        VariableSymbol,
        MethodSymbol,
        ClosureSymbol
} from '../../types/scope.d.ts'
import error from './error.ts'

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

interface ScopeNode {
    symbols: ScopeInterface
    parent: ScopeNode | null
}

export class ScopeStack {
    private head: ScopeNode | null = null

    constructor() {
        this.head = null
    }

    push(scope: ScopeInterface) {
        this.head = {
            symbols: scope,
            parent: this.head
        }
    }

    pop() {
        if (!this.head) {
            return undefined
        }
        const symbols = this.head.symbols
        this.head = this.head.parent
        return symbols
    }

    peek() {
        return this.head ? this.head.symbols : undefined
    }

    length() {
        let count = 0
        let current = this.head
        while (current) {
            count++
            current = current.parent
        }
        return count
    }

    getHead() {
        return this.head
    }

    getParentScope() {
        return this.head.symbols
    }

    get(name: string): any {
        let current = this.head
        let value: any = undefined
        let isFound = false

        while (current) {
            if (current.symbols.has(name)) {
                const symbol = current.symbols.get(name)
                // console.log('Symbol:', symbol)

                if (symbol) {
                    if (symbol.type === 'variable' || symbol.type === 'constant') {
                        value = symbol
                        isFound = true
                        break
                    } else if (symbol.type === 'function' || symbol.type === 'closure') {
                        value = symbol
                        isFound = true
                        break
                    } else if (symbol.type === 'class') {
                        value = symbol
                        isFound = true
                        break
                    } else {
                        console.log('[scope.ts]: Symbol:', symbol)
                        break
                    }
                }
            }

            // console.log("current:", current)
            current = current.parent
        }

        if (!isFound) {
            error(`Undefined variable "${name}"`)
        }

        return value
    }

    has(name: string): boolean {
        let current = this.head
        while (current) {
            if (current.symbols.has(name)) {
                return true
            }
            current = current.parent
        }
        return false
    }

    pushParentedScope(parent: any, scope: ScopeInterface) {
        this.head = {
            symbols: scope,
            parent
        }
    }

    storeClosure(
        name: string,
        arity: number,
        returnType: string,
        entryPoint: number,
    ) {
        if (!this.head) {
            error('No active scope found')
        }

        this.head.symbols.set(name, {
            type: 'closure',
            arity,
            returnType,
            entryPoint,
            parent: this.head
        } as any)
    }

    storeMethod(
        name: string,
        arity: number,
        isStatic: boolean,
        accessModifier: 'private' | 'public',
        returnType: string,
        entryPoint: number
    ) {
        if (!this.head) {
            error(`No active scope found`)
        }

        const prop: MethodSymbol = {
            type: 'function',
            isStatic,
            accessModifier,
            entryPoint,
            arity,
            returnType
        }

        this.head.symbols.set(name, prop)
    }

    storeProperty(
        propertyName: string,
        isStatic: boolean,
        accessModifier: 'private' | 'public',
        value: any,
        dataType: string
    ) {
        if (!this.head) {
            error(`No active scope found`)
        }

        const prop: PropertySymbol = {
            type: 'variable',
            value,
            isStatic,
            accessModifier,
            dataType
        }

        this.head.symbols.set(propertyName, prop)
    }

    storeConstant(name: string, value: any): void {
        if (!this.head) {
            error("No active scope")
        }

        if (this.head.symbols.has(name)) {
            error(`Constant "${name}" is already declared`)
        }

        const symbol: Symbol = {
            type: 'constant',
            dataType: value !== null && value !== undefined ? typeof value : 'any',
            value: value
        }
        this.head.symbols.set(name, symbol)
    }

    storeNativeFunction(name: string, arity: number, returnType: string, entryPoint: number): void {
        const symbol: FunctionSymbol = {
            type: 'function',
            arity,
            returnType,
            entryPoint
        }

        if (!this.head) {
            this.head = {
                symbols: new Map<string, Symbol>(),
                parent: null
            }
            this.head.symbols.set(name, symbol)
            return
        }

        let current = this.head
        while (current.parent) {
            current = current.parent
        }
        current.symbols.set(name, symbol)
    }

    storeUserDefinedFunction(name: string, arity: number, returnType: string, entryPoint: number): void {
        if (!this.head) {
            error('No active scope found')
        }

        if (this.head.symbols.has(name)) {
            error(`Function "${name}" is already registered`)
        }

        const symbol: FunctionSymbol = {
            type: 'function',
            arity,
            returnType,
            entryPoint
        }

        this.head.symbols.set(name, symbol)
    }

    storeClass(name: string): void {
        if (!this.head) {
            error('No active scope found')
        }

        if (this.head.symbols.has(name)) {
            error(`Class "${name}" is already registered`)
        }

        const symbol: ClassSymbol = {
            type: 'class',
            methods: new Map<string, MethodSymbol>(),
            properties: new Map<string, PropertySymbol>(),
        }

        this.head.symbols.set(name, symbol)
    }

    storeVariable(name: string, value: any): void {
        if (!this.head) {
            error("No active scope")
        }

        if (this.head.symbols.has(name)) {
            error(`Variable "${name}" is already declared`)
        }
        const symbol: Symbol = {
            type: 'variable',
            dataType: value !== null && value !== undefined ? typeof value : 'any',
            value: value
        }
        this.head.symbols.set(name, symbol)
    }

    updateVariable(name: string, value: any): void {
        let current = this.head
        let isFound = false

        while (current) {
            if (current.symbols.has(name)) {
                const symbol = current.symbols.get(name)
                if (symbol) {
                    isFound = true

                    if (symbol.type === 'variable') {
                        const varSymbol = symbol as VariableSymbol
                        varSymbol.value = value
                        varSymbol.dataType = value !== null && value !== undefined ? typeof value : 'any'
                        break
                    } else if (symbol.type === 'constant') {
                        error(`Cannot re-assign the constant`)
                        break
                    }
                }
            }
            current = current.parent
        }

        if (!isFound) {
            error(`Undefined variable "${name}"`)
        }
    }

    getScopeStack(): ScopeInterface[] {
        const list: ScopeInterface[] = []
        let current = this.head
        while (current) {
            list.push(current.symbols)
            current = current.parent
        }
        return list.reverse()
    }
}