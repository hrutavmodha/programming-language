interface LoopContext {
    continuePatchPoints: Array<number>
    breakPatchPoints: Array<number>
}

export interface LoopContextStackInterface {
    push(context: LoopContext): void;
    pop(): LoopContext;
    peek(): LoopContext;
    peekContinuePatchPoints(): Array<number>;
    peekBreakPatchPoints(): Array<number>;
}