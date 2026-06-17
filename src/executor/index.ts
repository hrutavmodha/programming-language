import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import { ScopeStack } from '../shared/scope.ts'
import type { ClassSymbol, Symbol } from '../../types/scope.ts'
import { nativeFunctions } from '../shared/native-functions.ts'
import error from '../shared/error.ts'
import type { FunctionMetaData } from '../../types/functions.d.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private scopeStack: ScopeStack;
    private callStack: Array<FunctionMetaData>;
    private currentClass: string | null = null

    constructor(state: ExecutorState, constantPool: ConstantPool) {
        this.state = state
        this.constantPool = constantPool
        this.scopeStack = new ScopeStack()
        this.callStack = []
    }

    logDataStructures() {
        console.log("Stack:", JSON.stringify(
            this.state.getStack(),
            (_: any, value: any) => (value instanceof Map ? Object.fromEntries(value) : value),
            2
        ))
        console.log("Symbol Table:", JSON.stringify(
            this.scopeStack,
            (_: any, value: any) => (value instanceof Map ? Object.fromEntries(value) : value),
            2
        ))
        console.log("Constant Pool:", JSON.stringify(this.constantPool.getPool(), null, 2))
    }

    verify(instructions: Uint8Array) {
        if (instructions[0] !== 77 || instructions[1] !== 72) {
            error(`Cannot execute malicious bytecode payload`)
        } else {
            this.state.increment()
            this.state.increment()
        }
    }

    execute() {
        this.verify(this.state.getInstructions())

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
                } case 5: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b % a)
                } case 6: {
                    this.state.increment()
                    const valueIdx = this.state.peek()
                    const value = this.constantPool.get(valueIdx)
                    this.state.push(value)
                    break
                } case 7: {
                    const value = this.state.pop()
                    this.state.push(-value)
                    break
                } case 8: {
                    const value = this.state.pop()
                    this.state.push(!value)
                    break
                } case 9: {
                    this.state.push(null)
                    break
                } case 10: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.scopeStack.storeVariable(name, this.state.pop())
                    break
                } case 11: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.state.push(this.scopeStack.get(name))
                    break
                } case 12: {
                    this.state.increment()
                    const value = this.state.pop()
                    const varIdx = this.state.peek()
                    const variable = this.constantPool.get(varIdx)
                    this.scopeStack.updateVariable(variable, value)
                    this.state.push(value)
                    break
                } case 13: {
                    this.state.increment()
                    const value = this.state.pop()

                    if (value === false) {
                        this.state.jump(this.state.peek())
                        continue
                    } else {
                        break
                    }
                } case 14: {
                    this.state.increment()
                    this.state.jump(this.state.peek())
                    continue
                } case 15: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a > b)
                    break
                } case 16: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a < b)
                    break
                } case 17: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a >= b)
                    break
                } case 18: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a <= b)
                    break
                } case 19: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a === b)
                    break
                } case 20: {
                    const b = this.state.pop()
                    const a = this.state.pop()
                    this.state.push(a !== b)
                    break
                } case 21: {
                    this.scopeStack.push(new Map<string, Symbol>())
                    break
                } case 22: {
                    if (this.currentClass !== null) {
                        const scope = this.scopeStack.pop()
                        const classSymbol = this.scopeStack.get(this.currentClass)
                        
                        scope.forEach((symbol: Symbol, name: string) => {
                            switch (symbol.type) {
                                case 'variable': {
                                    classSymbol.properties.set(name, symbol as any)
                                    break
                                } case 'function': {
                                    classSymbol.methods.set(name, symbol as any)
                                    break
                                } default: {
                                    error(`Unsupported class member type: "${symbol.type}"`)
                                }
                            }
                        })
                        this.currentClass = null
                    } else {
                        this.scopeStack.pop()
                    }
                    break
                } case 23: {
                    this.state.pop()
                    break
                } case 24: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.scopeStack.storeConstant(name, this.state.pop())
                    break
                } case 25: {
                    this.state.increment()
                    const value = this.state.pop()

                    if (value === true) {
                        this.state.jump(this.state.peek())
                        continue
                    } else {
                        break
                    }
                } case 26: {
                    this.state.push(this.state.peekStack())
                    break
                } case 27: {
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
                } case 28: {
                    this.state.increment()
                    const fnIdx = this.state.peek()

                    this.state.increment()
                    const arity = this.state.peek()
                    
                    const fnName = this.constantPool.get(fnIdx)
                    const Obj = this.scopeStack.get(fnName)

                    if (Obj.type === 'function') {
                        if (Obj.arity !== arity) {
                            error(`Expected ${Obj.arity} arguments, but got ${arity}`)
                        }

                        this.callStack.push({
                            scopeDepth: this.scopeStack.length(),
                            returnAddress: this.state.getCurrentInstructionPointer()
                        })

                        this.state.jump(Obj.entryPoint)

                    } else if (Obj.type === 'class') {
                        // const instance = {
                        //     [fnName]: 
                        // }

                        this.state.push(Obj)
                    }
                    break
                } case 29: {
                    this.state.increment()
                    const fnNameIdx = this.state.peek()

                    const fnName = this.constantPool.get(fnNameIdx)
                    this.state.increment()
                    this.scopeStack.storeUserDefinedFunction(fnName, this.state.peek(), 'any', this.state.getCurrentInstructionPointer() + 3)
                    break
                } case 30: {
                    const callFrame = this.callStack.pop()

                    for (let i = 0; this.scopeStack.length() > callFrame.scopeDepth; i++) {
                        this.scopeStack.pop()
                    }
                    
                    this.state.jump(callFrame.returnAddress)
                    break
                } case 31: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b && a)
                    break
                } case 32: {
                    const a = this.state.pop()
                    const b = this.state.pop()
                    this.state.push(b || a)
                    break
                } case 33: {
                    this.state.increment()
                    
                    const className = this.constantPool.get(this.state.peek())

                    this.scopeStack.storeClass(className)
                    this.currentClass = className

                    this.state.increment()
                    this.state.increment()
                    break
                } case 34: {
                    this.state.increment()
                    const methodIdx = this.state.peek()
                    const methodName = this.constantPool.get(methodIdx)

                    this.state.increment()
                    const arity = this.state.peek()

                    const args: Array<any> = []
                    for (let i = 0; i < arity; i++) {
                        args.unshift(this.state.pop())
                    }

                    const instance = this.state.pop()
                    this.state.jump(instance.methods.get(methodName).entryPoint)
                    break
                } case 35: {
                    this.state.increment()

                    const propIdx = this.state.peek()
                    const propName = this.constantPool.get(propIdx)
                    
                    const instance = this.state.pop()

                    this.state.push(instance.properties.get(propName).value)
                    break
                } case 36: {
                    this.state.increment()
                    const newValue = this.state.pop()
                    const propIdx =  this.state.peek()
                    const propName = this.constantPool.get(propIdx)
                    const instance = this.state.pop()
                    instance.properties.get(propName).value = newValue 
                    // this.state.push(newValue)
                    break
                } default: {
                    console.log(`Stuck at: ${this.state.getCurrentInstructionPointer()}: ${this.state.peek()}`)
                }
            }
            
            this.state.increment()
        }
    }
}
