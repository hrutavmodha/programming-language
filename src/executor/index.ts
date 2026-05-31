import ExecutorState from './state.ts'
import ConstantPool from '../shared/constant-pool.ts'
import SymbolTable from '../shared/symbol-table.ts'

export default class Executor {
    private state: ExecutorState;
    private constantPool: ConstantPool;
    private symbolTable: SymbolTable;

    constructor(state: ExecutorState, constantPool: ConstantPool) {
        this.state = state
        this.constantPool = constantPool
        this.symbolTable = new SymbolTable()
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
                }
            }
            // console.log(this.constantPool)
            // console.log(this.symbolTable)
            // console.log(this.state)
            this.state.increment()
        }
    }
}
