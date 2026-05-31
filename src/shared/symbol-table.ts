import error from './error.ts'

export default class SymbolTable {
    private symbolTable: { [key: string]: any } = {}
    
    store(variable: string, value: any) {
        if (variable in this.symbolTable) {
            error(`Variable "${variable}" is already declared`)
        }
        this.symbolTable[variable] = value
    }
}