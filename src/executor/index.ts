import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import SymbolTable from '../shared/symbol-table.ts'
import { timeStamp } from 'console';

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private symbolTable: SymbolTable;

    constructor(state: ExecutorState, constantPool: ConstantPool, symbolTable: SymbolTable) {
        this.state = state
        this.constantPool = constantPool
        this.symbolTable = symbolTable
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
                    console.log(this.state.pop())
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
                    this.symbolTable.store(name, this.state.pop())
                    break
                } case 12: {
                    this.state.increment()
                    const name = this.constantPool.get(this.state.peek())
                    this.state.push(this.symbolTable.get(name))
                    break
                } case 13: {
                    this.state.increment()
                    const value = this.state.pop()
                    const varIdx = this.state.peek()
                    const variable = this.constantPool.get(varIdx)
                    this.symbolTable.update(variable, value)
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
                }
            }
            this.state.increment()
        }
    }
}
