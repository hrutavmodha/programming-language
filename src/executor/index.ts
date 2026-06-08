import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import { ScopeStack } from '../shared/scope.ts'
import type { Symbol } from '../../types/scope.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private scopeStack: ScopeStack;

    constructor(state: ExecutorState, constantPool: ConstantPool) {
        this.state = state
        this.constantPool = constantPool
        this.scopeStack = new ScopeStack()
    }

    private logDataStructures() {
        console.log("Stack:", JSON.stringify(this.state.getStack(), null, 2))
        console.log("Symbol Table:", JSON.stringify(
            this.scopeStack.scopeStack,
            (_: any, value: any) => (value instanceof Map ? Object.fromEntries(value) : value),
            2
        ))
        console.log("Constant Pool:", JSON.stringify(this.constantPool.getPool(), null, 2))
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
                    this.scopeStack.storeVariable(name, this.state.pop())
                    break
                } case 12: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.state.push(this.scopeStack.get(name))
                    break
                } case 13: {
                    this.state.increment()
                    const value = this.state.pop()
                    const varIdx = this.state.peek()
                    const variable = this.constantPool.get(varIdx)
                    this.scopeStack.updateVariable(variable, value)
                    this.state.push(value)
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
                    this.scopeStack.push(new Map<string, Symbol>())
                    break
                } case 23: {
                    this.scopeStack.pop()
                    break
                } case 24: {
                    this.state.pop()
                    break
                } case 25: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.scopeStack.storeConstant(name, this.state.pop())
                    break
                } case 26: {
                    this.state.increment()
                    const value = this.state.pop()

                    if (value === true) {
                        this.state.jump(this.state.peek())
                        continue
                    } else {
                        break
                    }
                } case 27: {
                    this.state.push(this.state.peekStack())
                    break
                }
            }
            this.state.increment()
            // this.logDataStructures()
        }
    }
}
