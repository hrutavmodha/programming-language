import type { Program } from '../../types/nodes.d.ts'

export default class GeneratorState {
    private ast: Program = {
        type: 'Program',
        body: []
    }
    private bytecode: Array<number>
    private constantPool: Array<any>
    private constantPoolCursor: number = 0
    private cursor: number = 0

    constructor(ast: Program) {
        this.ast = ast
        this.bytecode = []
        this.cursor = 0
        this.constantPool = []
    }

    getAst() {
        return this.ast
    }

    push(element: number) {
        this.bytecode.push(element)
        this.cursor++
    }

    storeLiteral(value: string | boolean | number) {
        this.constantPool[this.constantPoolCursor] = value
        const returnValue = this.constantPoolCursor
        this.constantPoolCursor++
        return returnValue
    }

    getLiteral(index: number) {
        return this.constantPool[index]
    }

    getBytecode(): Uint8Array {
        return new Uint8Array(this.bytecode)
    }

    getConstantPool() {
        return this.constantPool
    }
}