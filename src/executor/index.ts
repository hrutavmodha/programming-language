import ExecutorState from './state.ts'
import { generatorState } from '../index.ts'

export default class Executor {
    private state: ExecutorState

    constructor(state: ExecutorState) {
        this.state = state
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
                    const value = generatorState.getLiteral(valueIdx)
                    this.state.push(value)
                    break
                } case 7: {
                    console.log(this.state.pop())
                    break
                }
            }
            
            this.state.increment()
        }
        // console.log(generatorState.getConstantPool())
        // console.log(this.state)
    }
}