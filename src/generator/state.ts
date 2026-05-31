import type { Program } from '../../types/nodes.d.ts'

export default class GeneratorState {
    private ast: Program = {
        type: 'Program',
        body: []
    }
    private bytecode: Array<number>
    private cursor: number = 0

    constructor(ast: Program) {
        this.ast = ast
        this.bytecode = []
        this.cursor = 0
    }

    getAst() {
        return this.ast
    }

    push(element: number) {
        this.bytecode.push(element)
        this.cursor++
    }

    getBytecode(): Uint8Array {
        return new Uint8Array(this.bytecode)
    }
}
