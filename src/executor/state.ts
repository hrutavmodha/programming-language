export default class ExecutorState {
    private instructions: ArrayBuffer
    private instructionPointer: number = 0
    private stack: Array<any> = []

    constructor(newInstructions: ArrayBuffer) {
        this.instructions = newInstructions
        this.instructionPointer = 0
        this.stack = []
    }
    
    peek(offset: number = 0): number {
        return this.instructions[this.instructionPointer + offset]
    }

    push(element: any) {
        this.stack.push(element)
    }

    pop(): any {
        return this.stack.pop()
    }

    advance(): number {
        return this.instructions[this.instructionPointer++]
    }
    
    isAtEnd(): boolean {
        return this.instructionPointer >= this.instructions.byteLength
    }

    increment(): void {
        this.instructionPointer++
    }
}