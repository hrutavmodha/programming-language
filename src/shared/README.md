# Shared & Utilities Module

This module provides common utilities and data structures shared by the lexer, parser, analyzer, generator, and executor.

## 1. Description
The shared module contains structural implementations such as block-scoped variable tables, constant deduplication pools, standard native function mappings, and error exit utilities.

## 2. How to Import
```typescript
import { Scope, ScopeStack } from './scope.ts'
import ConstantPool from './constant-pool.ts'
import { nativeFunctions } from './native-functions.ts'
import error from './error.ts'
```

## 3. Minimal Working Example
```typescript
import ConstantPool from './constant-pool.ts'
import { ScopeStack } from './scope.ts'

// Manage constant indexes
const pool = new ConstantPool()
const index = pool.store("unique_constant")
console.log(pool.get(index)) // Outputs: unique_constant

// Manage block scopes
const scopes = new ScopeStack()
scopes.push(new Map())
scopes.storeVariable("a", 10)
scopes.push(new Map()) // Enter sub-scope
scopes.storeVariable("a", 20) // Shadows outer variable 'a'
console.log(scopes.get("a")) // Outputs: 20
scopes.pop() // Exit sub-scope
console.log(scopes.get("a")) // Outputs: 10
```

## 4. API Reference
* [scope.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/scope.ts): Implements [Scope](file:///home/hrutav-modha/Documents/programming-language/src/shared/scope.ts#L12) and [ScopeStack](file:///home/hrutav-modha/Documents/programming-language/src/shared/scope.ts#L45) supporting nested scopes, variable assignment/mutation, shadowing, and constant preservation. Configured based on types in [types/scope.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/scope.d.ts).
* [constant-pool.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/constant-pool.ts): Implements [ConstantPool](file:///home/hrutav-modha/Documents/programming-language/src/shared/constant-pool.ts#L1) which acts as a dictionary of primitive constants.
* [native-functions.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/native-functions.ts): Map of registered system bindings (e.g. `print()`, `add()`).
* [error.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/error.ts): Standard formatted error reporting helper that halts execution with exit code 1.

## 5. Design Constraints & Status
* `ScopeStack` does not support lexical closure environments for custom functions (functions cannot capture variables from their outer scopes yet).
