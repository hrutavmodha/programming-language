export interface BaseSymbol { 
    type: 'variable' | 'constant' | 'function' | 'class'
}

export interface VariableSymbol extends BaseSymbol {
    dataType: string | null
    value?: any
}

export interface ConstantSymbol extends BaseSymbol {
    dataType: string | null
    value?: any
}

export interface FunctionSymbol extends BaseSymbol {
    arity: number
    returnType: string,
    entryPoint: number
}

export interface PropertySymbol extends VariableSymbol {
    accessModifier: string | null
    isStatic: boolean
}

export interface MethodSymbol extends FunctionSymbol {
    accessModifier: string | null
    isStatic: boolean
}


export interface ClassSymbol extends BaseSymbol {
    methods: Map<string, MethodSymbol>
    properties: Map<string, PropertySymbol>
}

export type Symbol = VariableSymbol | ConstantSymbol | FunctionSymbol | ClassSymbol | PropertySymbol | MethodSymbol

export type ScopeInterface = Map<string, Symbol>

export type ScopeStackInterface = ScopeInterface[]
