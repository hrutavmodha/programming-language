import error from './error.ts'

export default class SymbolTable {
    private symbolTable: { [key: string]: any } = {}
    
    store(variable: string, value: any) {
        if (variable in this.symbolTable) {
            error(`Variable "${variable}" is already declared`)
        }

        this.symbolTable[variable] = value
    }

    get(variable: string) {
        if (!(variable in this.symbolTable)) {
            error(`Undefined variable "${variable}"`)
        }

        return this.symbolTable[variable]
    }

    update(variable: string, value: any) {
        if (!(variable in this.symbolTable)) {
            error(`Undefined variable "${variable}"`)
        }

        this.symbolTable[variable] = value
    }
}