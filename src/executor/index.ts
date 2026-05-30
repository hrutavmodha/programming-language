import ExecutorState from './state.ts'
import GeneratorState from '../generator/state.ts'

export default class Executor {
    private state: ExecutorState
    private generatorState: GeneratorState

    constructor(state: ExecutorState, generatorState: GeneratorState) {
        this.state = state
        this.generatorState = generatorState
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
                    const value = this.generatorState.getLiteral(valueIdx)
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
                }
            }
            
            this.state.increment()
        }
    }
}