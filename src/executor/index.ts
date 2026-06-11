import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import { ScopeStack } from '../shared/scope.ts'
import type { Symbol } from '../../types/scope.ts'
import { nativeFunctions } from '../shared/native-functions.ts'
import error from '../shared/error.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private scopeStack: ScopeStack;
    private callStack: Array<number>;

    constructor(state: ExecutorState, constantPool: ConstantPool) {
        this.state = state
        this.constantPool = constantPool
        this.scopeStack = new ScopeStack()
        this.callStack = []
    }

    private logDataStructures() {
        console.log("Stack:", JSON.stringify(this.state.getStack(), null, 2))
        console.log("Symbol Table:", JSON.stringify(
            this.scopeStack,
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
                } case 28: {
                    this.state.increment()
                    const fnIdx = this.state.peek()

                    this.state.increment()
                    const arity = this.state.peek()

                    const args: Array<any> = []
                    for (let i = 0; i < arity; i++) {
                        args.unshift(this.state.pop())
                    }
                    
                    const fnName = this.constantPool.get(fnIdx)
                    const res = nativeFunctions[fnName](...args)
                    
                    this.state.push(res)
                    break
                } case 29: {
                    this.state.increment()
                    const fnIdx = this.state.peek()

                    this.state.increment()
                    const arity = this.state.peek()
                    
                    const fnName = this.constantPool.get(fnIdx)
                    const fnObj = this.scopeStack.get(fnName)

                    if (fnObj.arity !== arity) {
                        error(`Expected ${fnObj.arity} arguments, but got ${arity}`)
                    }

                    this.callStack.push(this.state.getCurrentInstructionPointer())
                    this.state.jump(fnObj.entryPoint)
                    continue
                } case 30: {
                    this.state.increment()
                    const fnNameIdx = this.state.peek()

                    const fnName = this.constantPool.get(fnNameIdx)
                    this.state.increment()
                    this.scopeStack.storeUserDefinedFunction(fnName, this.state.peek(), 'any', this.state.getCurrentInstructionPointer() + 3)
                    this.logDataStructures()
                    break
                } case 31: {
                    const returnAddress = this.callStack.pop()
                    this.state.jump(returnAddress)
                    break
                } default: {
                    console.log(`Stuck at: ${this.state.getCurrentInstructionPointer()}: ${this.state.peek()}`)
                }
            }
            this.state.increment()
        }
    }
}
