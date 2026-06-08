import type { LoopContext, LoopContextStackInterface } from '../../types/loop.d.ts'

export default class LoopContextStack implements LoopContextStackInterface {

    private loopContext: Array<LoopContext>;
    private cursor: number;

    constructor() {
        this.loopContext = []  
        this.cursor = 0
    }

    push(context: LoopContext): void {
        this.cursor = this.loopContext.push(context) - 1
    }

    pop(): LoopContext {
        this.cursor--
        return this.loopContext.pop()
    }

    peek(): LoopContext {
        return this.loopContext[this.cursor]
    }

    peekContinuePatchPoints() {
        return this.loopContext[this.cursor].continuePatchPoints
    }

    peekBreakPatchPoints(): Array<number> {
        return this.loopContext[this.cursor].breakPatchPoints
    }
}