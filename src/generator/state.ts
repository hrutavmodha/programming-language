import type { Program } from '../../types/nodes.d.ts'

export default class GeneratorState {
    private ast: Program = {
        type: 'Program',
        body: []
    }
    private bytecode: Array<number>
    private cursor: number = 0
    private astCursor = 0

    constructor(ast: Program) {
        this.ast = ast
        this.bytecode = []
        this.cursor = 0
        this.astCursor = 0
    }

    getAst() {
        return this.ast
    }

    length() {
        return this.cursor
    }

    increment() {
        this.astCursor++
    }

    isAtEnd() {
        return this.astCursor >= this.ast.body.length
    }

    peek(offset: number = 0) {
        return this.ast.body[this.astCursor + offset]
    }

    update(index: number, instruction: number) {
        this.bytecode[index] = instruction
    }

    push(element: number) {
        this.bytecode.push(element)
        this.cursor++
    }

    getBytecode(): Uint8Array {
        return new Uint8Array(this.bytecode)
    }
}
