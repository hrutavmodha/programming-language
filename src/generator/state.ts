import type { Program } from '../../types/nodes.d.ts'

export default class GeneratorState {
    private ast: Program = {
        type: 'Program',
        body: []
    }
    private bytecode: ArrayBuffer
    private constantPool: Array<any>
    private constantPoolCursor: number = 0
    private cursor: number = 0

    constructor(ast: Program) {
        this.ast = ast
        this.bytecode = new ArrayBuffer(10)
        this.cursor = 0
        this.constantPool = []
    }

    getAst() {
        return this.ast
    }

    reallocate(elementNo: number) {
        let newBytecodes = new ArrayBuffer(this.bytecode.byteLength + elementNo)
        newBytecodes = this.bytecode
    }

    push(element: number) {
        if (this.cursor <= this.bytecode.byteLength) {
            this.reallocate(10)
        }

        this.bytecode[this.cursor] = element
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

    getBytecode() {
        return this.bytecode
    }

    getConstantPool() {
        return this.constantPool
    }
}