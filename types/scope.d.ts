export interface BaseSymbol { 
    type: 'variable' | 'constant' | 'function' | 'class'
}

export interface VariableSymbol extends BaseSymbol {
    dataType: any
}

export interface ConstantSymbol extends BaseSymbol {
    dataType: any,
    value?: any
}

export interface FunctionSymbol extends BaseSymbol {
    arity: number
    parameters: Map<string, VariableSymbol>
    returnType: string
}

export interface ClassSymbol extends BaseSymbol {
    methods: Map<string, FunctionSymbol>
    properties: Map<string, VariableSymbol>
}

export type Symbol = VariableSymbol | ConstantSymbol | FunctionSymbol | ClassSymbol

export type ScopeInterface = Map<string, Symbol>

export type ScopeStackInterface = ScopeInterface[]
