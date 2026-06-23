import type { Node, Program } from '../../types/nodes.d.ts'
import { ScopeStack } from '../shared/scope.ts'
import { filePath } from '../index.ts'
import { readFileSync } from 'fs'
import error from '../shared/error.ts'

export default class AnalyzerState {
    private ast: Program;
    private analyzedAst: Program;
    private cursor: number = 0
    private analyzedAstCursor: number = 0
    scopeStack: ScopeStack;

    constructor(ast: Program) {
        this.ast = ast
        this.cursor = 0
        this.analyzedAst = {
            type: 'Program',
            body: []
        }
        this.scopeStack = new ScopeStack()
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

    peek(offset: number = 0) {
        return this.ast.body[this.cursor + offset]
    }

    isAtEnd() {
        return this.cursor >= this.ast.body.length
    }

    increment() {
        this.cursor++
    }

    push(node: Node) {
        this.analyzedAst.body[this.analyzedAstCursor] = node
        this.analyzedAstCursor++
    }

    getAnalyzedAst() {
        return this.analyzedAst
    }
}