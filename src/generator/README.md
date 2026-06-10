# Code Generator Module

This module compiles the parsed Abstract Syntax Tree (AST) into a linear array of custom bytecode instructions.

## 1. Description

The generator converts hierarchy-oriented AST nodes into stack-based postfix instructions (opcodes). It deduplicates literal values (numbers, strings, booleans) by storing them in a shared [ConstantPool](file:///home/hrutav-modha/Documents/programming-language/src/shared/constant-pool.ts) and referencing them by array index. Additionally, the generator manages control flow by tracking loop stacks and resolving/patching target jump coordinates for `if`, `while`, `do-while`, `for`, and `switch` statements.

## 2. How to Import

```typescript
import Generator from './index.ts'
import GeneratorState from './state.ts'
```

## 3. Minimal Working Example

```typescript
import Generator from './index.ts'
import GeneratorState from './state.ts'

// Assumes ast is a parsed Program AST node
const state = new GeneratorState(ast)
const generator = new Generator(state)

const bytecode = generator.generate() // Returns Uint8Array
const constantPool = generator.getConstantPool()
```

## 4. API Reference

* [Generator](file:///home/hrutav-modha/Documents/programming-language/src/generator/index.ts): Main compiler driver.
  * `generate()`: Compiles AST into a [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) of bytecodes.
  * `getConstantPool()`: Returns the populated ConstantPool instance.
* [GeneratorState](file:///home/hrutav-modha/Documents/programming-language/src/generator/state.ts): Manages compilation cursors, bytecode arrays, and instruction insertions.
* [LoopContextStack](file:///home/hrutav-modha/Documents/programming-language/src/generator/loop-context.ts): Tracks nested loop states and offsets for updating dynamic continue and break jump locations. Defined using interfaces in [types/loop.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/loop.d.ts).

