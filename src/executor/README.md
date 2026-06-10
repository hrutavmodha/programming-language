# Virtual Machine (Executor) Module

This module implements a stack-based virtual machine (VM) that executes compiled bytecode.

## 1. Description
The executor acts as a lightweight VM runtime. It reads compiled opcodes sequentially and evaluates operations using an internal evaluation stack. It handles local scope pushes and pops, retrieves variables from scoped tables, manages jump-based control flow (conditionals, loops), and delegates native function calls.

## 2. How to Import
```typescript
import Executor from './index.ts'
import ExecutorState from './state.ts'
```

## 3. Minimal Working Example
```typescript
import Executor from './index.ts'
import ExecutorState from './state.ts'

// Assumes bytecode is a Uint8Array, constantPool is a ConstantPool instance
const state = new ExecutorState(bytecode)
const executor = new Executor(state, constantPool)

executor.execute()
```

## 4. API Reference
* [Executor](file:///home/hrutav-modha/Documents/programming-language/src/executor/index.ts): Virtual machine driver.
  * `execute()`: Runs the instruction loop until it reaches the end of the byte stream.
* [ExecutorState](file:///home/hrutav-modha/Documents/programming-language/src/executor/state.ts): Encapsulates the VM instruction pointer (`instructionPointer`), the evaluation stack (`stack`), and binary instructions (`instructions`).
* Refer to [OPCODES.md](file:///home/hrutav-modha/Documents/programming-language/OPCODES.md) for the instruction set.
* Refer to [src/shared/native-functions.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/native-functions.ts) for standard built-ins (e.g. `print`, `add`).


