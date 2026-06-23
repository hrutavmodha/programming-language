import type { Node, Program } from '../../types/nodes.d.ts'
import { readFileSync } from 'fs'
import { filePath } from '../index.ts'
import error from '../shared/error.ts'

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

    getRawInstructions(): any {
        return this.bytecode
    }

    reportError(msg: string, node?: Node) {
        const targetNode = node || this.peek()
        const row = targetNode?.row ?? 0
        const column = targetNode?.column ?? 0

        const fc = readFileSync(filePath).toString()
        const fcArr = fc.split('\n')
        const errorLine = fcArr[row] || ''

        let errStr = ''
        errStr += 'Error: ' + msg + '\n'
        errStr += `File ${filePath}:${row + 1}:${column}\n`
        errStr += `${row + 1} | ${errorLine}\n`

        const prefixLen = (row + 1).toString().length + 3
        for (let i = 0; i < prefixLen + column; i++) {
            errStr += ' '
        }
        errStr += '^'
        
        error(errStr)
    }
}
