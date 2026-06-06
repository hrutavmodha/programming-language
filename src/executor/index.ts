import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import { ScopeStack } from '../shared/scope.ts'
import type { Symbol, ScopeInterface, VariableSymbol } from '../../types/scope.ts'
import error from '../shared/error.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private symbolTable: ScopeStack;

    constructor(state: ExecutorState, constantPool: ConstantPool) {
        this.state = state
        this.constantPool = constantPool
        this.symbolTable = new ScopeStack()
        this.symbolTable.push(new Map<string, Symbol>())
    }

    private getFromSymbolTable(name: string): any {
        const popped: ScopeInterface[] = []
        let value: any = undefined
        let found = false

        while (true) {
            const scope = this.symbolTable.pop()
            if (!scope) {
                break
            }
            popped.push(scope)
            if (scope.has(name)) {
                const symbol = scope.get(name)
                if (symbol && symbol.type === 'variable') {
                    value = (symbol as VariableSymbol).dataType
                    found = true
                    break
                }
            }
        }

        for (let i = popped.length - 1; i >= 0; i--) {
            this.symbolTable.push(popped[i])
        }

        if (!found) {
            error(`Undefined variable "${name}"`)
        }

        return value
    }

    private storeInSymbolTable(name: string, value: any) {
        const scope = this.symbolTable.pop()
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
        this.symbolTable.push(scope)
    }

    private updateInSymbolTable(name: string, value: any) {
        const popped: ScopeInterface[] = []
        let found = false

        while (true) {
            const scope = this.symbolTable.pop()
            if (!scope) {
                break
            }
            popped.push(scope)
            if (scope.has(name)) {
                const symbol = scope.get(name)
                if (symbol && symbol.type === 'variable') {
                    (symbol as VariableSymbol).dataType = value
                    found = true
                    break
                }
            }
        }

        for (let i = popped.length - 1; i >= 0; i--) {
            this.symbolTable.push(popped[i])
        }

        if (!found) {
            error(`Undefined variable "${name}"`)
        }
    }

    execute() {
        while (!this.state.isAtEnd()) {
            switch (this.state.peek()) {
                case 1: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b + a)
                    break
                } case 2: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b - a)
                    break
                } case 3: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b * a)
                    break
                } case 4: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b / a)
                    break
                } case 6: {
                    this.state.increment()
                    const valueIdx = this.state.peek()
                    const value = this.constantPool.get(valueIdx)
                    this.state.push(value)
                    break
                } case 7: {
                    process.stdout.write(String(this.state.pop()) + '\n')
                    break
                } case 8: {
                    const value = this.state.pop()
                    this.state.push(-value)
                    break
                } case 9: {
                    const value = this.state.pop()
                    this.state.push(!value)
                    break
                } case 10: {
                    this.state.push(null)
                    break
                } case 11: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.storeInSymbolTable(name, this.state.pop())
                    break
                } case 12: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.state.push(this.getFromSymbolTable(name))
                    break
                } case 13: {
                    this.state.increment()
                    const value = this.state.pop()
                    const varIdx = this.state.peek()
                    const variable = this.constantPool.get(varIdx)
                    this.updateInSymbolTable(variable, value)
                    break
                } case 14: {
                    this.state.increment()
                    const value = this.state.pop()

                    if (value === false) {
                        this.state.jump(this.state.peek())
                        continue
                    } else {
                        break
                    }
                } case 15: {
                    this.state.increment()
                    this.state.jump(this.state.peek())
                    continue
                } case 16: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a > b)
                    break
                } case 17: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a < b)
                    break
                } case 18: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a >= b)
                    break
                } case 19: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a <= b)
                    break
                } case 20: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a === b)
                    break
                } case 21: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a !== b)
                    break
                } case 22: {
                    this.symbolTable.push(new Map<string, Symbol>())
                    break
                } case 23: {
                    this.symbolTable.pop()
                    break
                }
            }
            this.state.increment()
        }
        console.log("Stack:", JSON.stringify(this.state.getStack(), null, 2))
        console.log("Symbol Table:", JSON.stringify(this.symbolTable, null, 2))
        console.log("Constant Pool:", JSON.stringify(this.constantPool, null, 2))
    }
}
