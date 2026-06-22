# Implementing Closures in Hindavi Swaraj Scripting Language (HSSL)

This tutorial explains how to add closure support to the HSSL compiler pipeline and virtual machine (VM). Since the scope stack has been refactored to use a **linked-list-based structure** of nested environment frames (`ScopeNode`), implementing lexical closures becomes clean and straightforward.

---

## 1. Architectural Concept

A **closure** is a function combined with its lexical environment (the scope in which it was declared). This allows the inner function to access variables from its outer enclosing function even after the outer function has finished executing.

```
       Global Scope Node
             ^
             |
      Outer Scope Node (x = 10)  <--- Captured by Closure's Environment Pointer
             ^
             |
      Inner Scope Node (y = 20)
```

In our linked-list-based scope architecture, each scope frame (`ScopeNode`) points to its `parent` frame. A closure can simply store a reference to the active `ScopeNode` at the time of its definition. When the closure is called, a new local scope frame is pushed with its `parent` pointer directed to the captured scope frame instead of the global scope.

---

## 2. Step-by-Step Implementation Guide

To implement closures, changes are required across three phases of the pipeline: the Analyzer, the Generator, and the Executor.

### Phase A: Static Analysis (Analyzer)

1. **Detect Nested Functions**: During static analysis in [src/analyzer/index.ts](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/src/analyzer/index.ts), track when a function declaration or expression is defined inside another function.
2. **Resolve Enclosing Scopes**: Ensure that during lookup, variables accessed in nested scopes are validated against outer lexically enclosing environments rather than throwing undefined errors.

### Phase B: Bytecode & Generator Changes

We need to compile functions into closure creation instructions.

1. **Define a New OpCode**:
   Add a `CREATE_CLOSURE` opcode to [OPCODES.md](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/OPCODES.md).
   - **OpCode Name**: `CREATE_CLOSURE`
   - **OpCode Value**: `0x27` (or similar next available byte)
   - **Stack Effect**: Pops/reads the function template index, captures the current environment pointer, and pushes a closure object onto the evaluation stack.

2. **Emit Closure Instructions in the Generator**:
   Modify [src/generator/index.ts](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/src/generator/index.ts) under function compilation. When generating a function definition, emit `CREATE_CLOSURE` instead of a raw user-defined function registration:
   ```typescript
   this.state.push(OPCODES.CREATE_CLOSURE);
   const fnIdx = this.constantPool.store(functionName);
   this.state.push(fnIdx);
   ```

### Phase C: VM Execution (Executor)

1. **Define the Closure Runtime Value**:
   In `types/scope.d.ts`, define a `Closure` representation:
   ```typescript
   export interface ClosureSymbol {
       type: 'closure';
       arity: number;
       entryPoint: number;
       environment: ScopeNode | null; // Captured lexical scope node
   }
   ```

2. **Handle Closure Creation (`case CREATE_CLOSURE`)**:
   Implement the opcode in [src/executor/index.ts](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/src/executor/index.ts):
   ```typescript
   case OPCODES.CREATE_CLOSURE: {
       this.state.increment();
       const fnIdx = this.state.peek();
       const fnMetaData = this.constantPool.get(fnIdx);

       // Capture the current scope chain head
       const closure: ClosureSymbol = {
           type: 'closure',
           arity: fnMetaData.arity,
           entryPoint: fnMetaData.entryPoint,
           environment: this.scopeStack.getHead() // Add getHead() to ScopeStack public API
       };

       this.state.push(closure);
       break;
   }
   ```

3. **Modify Function Invocation (`case CALL`)**:
   When invoking a `ClosureSymbol`, set up its execution environment:
   - Pop the arguments and the closure instance.
   - Push the return address to the call stack.
   - Push a **new environment scope frame** whose `parent` pointer points to the closure's captured `environment` (instead of the caller's frame or global scope).
   ```typescript
   const callFrameScope = new Map<string, Symbol>();
   
   // Create the method/function scope node manually
   this.scopeStack.pushParented(callFrameScope, closure.environment); 
   ```

---

## 3. ScopeStack API Extensions

To support the above execution logic without breaking the public interface, add two simple environment-pointer methods to [ScopeStack](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/src/shared/scope.ts#L49) in [src/shared/scope.ts](file:///home/hrutav-modha/Documents/hindavi-swaraj-scripting-language/src/shared/scope.ts):

```typescript
// Returns the current head of the linked-list scope chain
public getHead(): ScopeNode | null {
  return this.head;
}

// Pushes a new scope frame with a custom parent pointer link (the closure environment)
public pushParented(scope: ScopeInterface, parent: ScopeNode | null) {
  this.head = {
    symbols: scope,
    parent: parent
  };
}
```

---

## 4. Concrete Example Walkthrough

Consider this nested counter example in HSSL:

```javascript
function makeCounter() {
    let count = 0;
    function increment() {
        count = count + 1;
        return count;
    }
    return increment;
}

let counter = makeCounter();
print(counter()); // Prints 1
print(counter()); // Prints 2
```

1. **Outer Execution**: `makeCounter()` runs, pushes a scope node containing `count = 0`.
2. **Closure Capture**: When `increment` is defined inside `makeCounter()`, it creates a `ClosureSymbol` capturing the scope node containing `count`.
3. **Outer Returns**: `makeCounter()` returns the closure. Even though `makeCounter` exits, the `count` variable is preserved on the heap because the closure maintains a reference to the outer scope node in its `environment` property.
4. **Invocation**: Calling `counter()` pushes a new scope frame parented by the captured scope node, resolving `count` via the parent pointer chain.
