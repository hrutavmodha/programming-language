# Semantic Analyzer Module

This module performs static analysis and semantic checks on the parsed Abstract Syntax Tree (AST).

## 1. Description

The analyzer validates compiler contracts prior to code generation. It verifies that variables are not declared multiple times in the same scope, validates the presence of valid parent loop contexts for jump statements (`break`/`continue`), checks native function call arities, and folds static constant expressions (e.g. arithmetic between numbers or string concatenation).

## 2. How to Import

```typescript
import Analyzer from './index.ts'
import AnalyzerState from './state.ts'
```

## 3. Minimal Working Example

```typescript
import Analyzer from './index.ts'
import AnalyzerState from './state.ts'

// Assumes ast is a Program AST node
const state = new AnalyzerState(ast)
const analyzer = new Analyzer(state)

// Inject basic native functions to prevent arity/lookup errors
state.scopeStack.storeFunction('print', 1, 'void')
state.scopeStack.storeFunction('add', 2, 'number')

const analyzedAst = analyzer.analyze()
```

## 4. API Reference

* [Analyzer](file:///home/hrutav-modha/Documents/programming-language/src/analyzer/index.ts): Core validator traversing AST statements and expressions.
  * `analyze()`: Performs semantic validation and static optimization, returning the annotated/folded AST.
  * `getSymbolTable()`: Returns the [ScopeStack](file:///home/hrutav-modha/Documents/programming-language/src/shared/scope.ts#L45) of symbols.
* [AnalyzerState](file:///home/hrutav-modha/Documents/programming-language/src/analyzer/state.ts): Encapsulates parsing cursor states, scope stacks, and the validation target.

## 5. Design Constraints & Status
* `IfStatement` semantic checks are currently stubbed (returns the unmodified node without verifying condition types or nested branches).
