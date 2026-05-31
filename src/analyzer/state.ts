import type { Node, Program } from '../../types/nodes.d.ts'
import SymbolTable from '../shared/symbol-table.ts'

export default class AnalyzerState {
    private ast: Program;
    private analyzedAst: Program;
    private cursor: number = 0
    private analyzedAstCursor: number = 0
    symbolTable: SymbolTable;

    constructor(ast: Program) {
        this.ast = ast
        this.cursor = 0
        this.analyzedAst = {
            type: 'Program',
            body: []
        }
        this.symbolTable = new SymbolTable()
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