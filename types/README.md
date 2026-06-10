# Types Declaration Module

This directory contains TypeScript declaration files (`.d.ts`) defining compile-time type contracts across the lexer, parser, analyzer, generator, and executor.

## 1. Description
The types folder acts as the central repository of structural interfaces. It defines representations for compiler tokens, abstract syntax tree nodes, semantic scope stack configurations, and compilation loop contexts.

## 2. How to Import
```typescript
import type { Token } from './tokens.d.ts'
import type { Node, Program } from './nodes.d.ts'
import type { Symbol } from './scope.d.ts'
```

## 3. Minimal Working Example
```typescript
import type { Token } from './tokens.d.ts'

const sampleToken: Token = {
    type: 'NUMBER_LITERAL',
    lexeme: '42',
    literal: '42',
    row: 1,
    column: 5
}
```

## 4. API Reference
* [tokens.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/tokens.d.ts): Defines the standard lexical [Token](file:///home/hrutav-modha/Documents/programming-language/types/tokens.d.ts#L1) interface.
* [nodes.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/nodes.d.ts): Defines recursive AST structures like [Node](file:///home/hrutav-modha/Documents/programming-language/types/nodes.d.ts#L1) and [Program](file:///home/hrutav-modha/Documents/programming-language/types/nodes.d.ts#L6).
* [scope.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/scope.d.ts): Defines symbol table types (`variable`, `constant`, `function`, `class`) and the scope stacks structure.
* [loop.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/loop.d.ts): Defines helper shapes used during bytecode generation to track continue and break offset patch points.

