import type { Node, Program } from '../../types/nodes.d.ts'
import { ScopeStack } from '../shared/scope.ts'

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