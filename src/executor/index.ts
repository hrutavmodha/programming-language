import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import { ScopeStack } from '../shared/scope.ts'
import type { ClassSymbol, ClosureSymbol, PropertySymbol, Symbol, VariableSymbol } from '../../types/scope.ts'
import { nativeFunctions } from '../shared/native-functions.ts'
import error from '../shared/error.ts'
import type { FunctionMetaData } from '../../types/functions.d.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private scopeStack: ScopeStack;
    private callStack: Array<FunctionMetaData>;
    private currentClass: string | null = null
    private parentScope: any = null

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
        if (
            instructions[0] !== 74 ||
            instructions[1] !== 66 ||
            instructions[2] !== 74 ||
            instructions[3] !== 83
        ) {
            error(`Cannot execute malicious bytecode payload: Invalid Magic Header.`);
        } else {
            this.state.increment();
            this.state.increment();
            this.state.increment();
            this.state.increment();
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
                    break
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
                    if (this.currentClass) {
                        console.log(this.currentClass)
                    }
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.scopeStack.storeVariable(name, this.state.pop())
                    break
                } case 11: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    const symbol = this.scopeStack.get(name)
                    this.state.push(symbol && (symbol.type === 'variable' || symbol.type === 'constant') ? symbol.value : symbol)
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
                    const newScope = new Map<string, Symbol>()

                    if (this.parentScope) {
                        this.scopeStack.pushParentedScope(this.parentScope, newScope)
                        this.parentScope = null
                    } else {
                        this.scopeStack.push(newScope)
                    }
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
                    let Obj = this.scopeStack.get(fnName)

                    if (Obj && (Obj.type === 'variable' || Obj.type === 'constant')) {
                        Obj = Obj.value
                    }

                    if (Obj && Obj.type === 'function') {
                        if (Obj.arity !== arity) {
                            error(`Expected ${Obj.arity} arguments, but got ${arity}`)
                        }

                        this.callStack.push({
                            scopeDepth: this.scopeStack.length(),
                            returnAddress: this.state.getCurrentInstructionPointer()
                        })

                        
                        this.state.jump(Obj.entryPoint)
                        continue
                        
                    } else if (Obj && Obj.type === 'closure') {
                        if (Obj.arity !== arity) {
                            error(`Expected ${Obj.arity} arguments, but got ${arity}`)
                        }

                        this.callStack.push({
                            scopeDepth: this.scopeStack.length(),
                            returnAddress: this.state.getCurrentInstructionPointer()
                        })
                        
                        this.parentScope = Obj.parent
                        
                        this.state.jump(Obj.entryPoint)
                        continue
                    } else if (Obj && Obj.type === 'class') {
                        const properties = new Map<string, PropertySymbol>()
                        const init = Obj.methods.get('init')
                        const instance = {
                            type: 'class',
                            properties,
                            'class': Obj,
                            methods: Obj.methods
                        }
                        const initArgs: Array<any> = []

                        Obj.properties.forEach((prop: any, key: string) => {
                            if (!prop.isStatic) {
                                properties.set(key, { ...prop })
                            }
                        })

                        
                        if (init) {
                            for (let i = 0; i < arity; i++) {
                                initArgs.push(this.state.pop())
                            }

                            if (initArgs.length !== init.arity) {
                                error(`Expected ${init.arity} argument(s), but got ${initArgs.length}`)
                            }

                            this.state.push(instance)
                            this.state.push(instance)

                            initArgs.reverse().forEach((arg: any) => {
                                this.state.push(arg)
                            })
                            
                            this.callStack.push({
                                scopeDepth: this.scopeStack.length(),
                                returnAddress: this.state.getCurrentInstructionPointer()
                            })

                            this.state.jump(init.entryPoint)
                            continue
                        } else {
                            if (arity > 0) {
                                error(`Expected no arguments, but got ${arity}`)
                            }
                            
                            this.state.push(instance)
                        }
                    }
                    break
                } case 29: {
                    this.state.increment()
                    const fnNameIdx = this.state.peek()

                    const fnName = this.constantPool.get(fnNameIdx)
                    this.state.increment()
                    
                    const closure: ClosureSymbol = {
                        type: 'closure',
                        parent: this.scopeStack.getParentScope(),
                        arity: this.state.peek(),
                        entryPoint: this.state.getCurrentInstructionPointer() + 3,
                        returnType: 'any'
                    }

                    this.scopeStack.storeClosure(fnName, closure.arity, closure.returnType, closure.entryPoint)
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

                    const instance = this.state.pop()

                    const args: Array<any> = []
                    for (let i = 0; i < arity; i++) {
                        args.unshift(this.state.pop())
                    }

                    this.callStack.push({
                        returnAddress: this.state.getCurrentInstructionPointer(),
                        scopeDepth: this.scopeStack.length()
                    })

                    this.state.push(instance)
                    args.forEach(arg => this.state.push(arg))

                    this.state.jump(instance.methods.get(methodName).entryPoint)
                    continue
                } case 35: {
                    this.state.increment()

                    const propIdx = this.state.peek()
                    const propName = this.constantPool.get(propIdx)
                    const instance = this.state.pop()
                    const prop =
                        instance.properties.get(propName) ||
                        instance['class'].properties.get(propName)

                    this.state.push(prop.value)
                    break
                } case 36: {
                    this.state.increment()

                    const newValue = this.state.pop()
                    const instance = this.state.pop()
                    const propIdx =  this.state.peek()
                    const propName = this.constantPool.get(propIdx)
                    const prop = instance.properties.get(propName)

                    if (prop) {
                        prop.value = newValue
                    } else {
                        instance['class'].properties.get(propName).value = newValue
                    }

                    this.state.push(newValue)
                    break
                } case 37: {
                    this.state.increment()
                    
                    const nameIdx = this.state.peek()
                    const name = this.constantPool.get(nameIdx)
                    const accessModifier = this.state.peek(1)
                    const isStatic = this.state.peek(2)
                    const value = this.state.pop()
                    
                    this.scopeStack.storeProperty(
                        name,
                        isStatic === 1,
                        accessModifier === 0 ? 'private' : 'public',
                        value, typeof value
                    )

                    this.state.increment()
                    this.state.increment()
                    break
                } case 38: {
                    this.state.increment()
                    const methodIdx = this.state.peek()

                    const methodName = this.constantPool.get(methodIdx)
                    this.state.increment()

                    const arity = this.state.peek()
                    this.state.increment()

                    const accessModifier = this.state.peek()
                    this.state.increment()

                    const isStatic = this.state.peek()

                    this.scopeStack.storeMethod(
                        methodName, arity,
                        isStatic === 1,
                        accessModifier === 0 ? 'private' : 'public',
                        'any',
                        this.state.getCurrentInstructionPointer() + 3
                    )

                    break
                } default: {
                    console.log(`Stuck at: ${this.state.getCurrentInstructionPointer()}: ${this.state.peek()}`)
                }
            }
            
            this.state.increment()
        }
    }
}
