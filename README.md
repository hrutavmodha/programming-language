# Custom Bytecode Virtual Machine & Compiler

A complete, production-grade programming language implementation in TypeScript featuring a Lexer, a Recursive Descent Parser, a Semantic Analyzer, a Bytecode Compiler, and a Stack-Based Virtual Machine Executor.

---

## Architecture Overview

The system compiles source code into a custom bytecode format that runs on a custom virtual machine. The execution pipeline follows the classic compiler/runtime design:

```
                  +--------------------------------+
                  |          Source Code           |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |             Lexer              |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |             Tokens             |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |             Parser             |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |      Abstract Syntax Tree      |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |       Semantic Analyzer        |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |      Analyzed AST & Types      |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |       Bytecode Generator       |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |     Bytecode & Const Pool      |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |       VM Executor Engine       |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |             Output             |
                  +--------------------------------+
```

---

## Language Features

The language supports a variety of modern imperative programming constructs:

- **Variables & Constants**: Dynamic variables declared with `let`, and immutable constants declared with `const`.
- **Control Flow**:
  - Conditional branching: `if-else` and `switch-case` (with `case` clauses and a `default` fallback).
  - Iteration: `while` loops, `do-while` loops, and `for` loops.
  - Jump control statements: `break` and `continue`.
- **Functions**: User-defined functions declared using the `function` keyword with parameter binding, block scoping, recursion, and explicit `return` values.
- **Expressions**:
  - Logical: `&&` and `||`.
  - Equality: `==` and `!=`.
  - Relational: `<`, `<=`, `>`, and `>=`.
  - Arithmetic: `+` (with number addition and string concatenation support), `-`, `*`, `/`, and `%`.
  - Unary: Logical negation (`!`) and numeric negation (`-`).
- **Standard Library / Native Integration**: Synchronous system interaction functions:
  - `print(value)`: Outputs a string representation of `value` to the terminal console.
  - `input(prompt)`: Displays a prompt and synchronously waits for string input from `/dev/tty`.

---

## Detailed Pipeline Phases

### 1. Lexer (`src/lexer/`)
The lexer converts raw source code into a list of structured token objects (defined in [types/tokens.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/tokens.d.ts)). It handles:
- Skipping single-line comments (`//`) and multi-line comments (`/* ... */`).
- Handling identifier names and reserved keyword lookup.
- Building numeric literals (supporting both integer and decimal formats) and string literals (supporting single/double quotes).
- Categorizing operator punctuations.

### 2. Parser (`src/parser/`)
The parser is a recursive descent parser with precedence climbing to construct the Abstract Syntax Tree (AST) (defined in [types/nodes.d.ts](file:///home/hrutav-modha/Documents/programming-language/types/nodes.d.ts)). The operator precedence is parsed in the following order (from lowest to highest):
1. **Assignment** (`=`)
2. **Logical OR** (`||`)
3. **Logical AND** (`&&`)
4. **Equality** (`==`, `!=`)
5. **Comparison** (`<`, `<=`, `>`, `>=`)
6. **Additive** (`+`, `-`)
7. **Multiplicative** (`*`, `/`, `%`)
8. **Unary** (`!`, `-`)
9. **Function Call** (`callee(...)`)
10. **Primary** (Literals, Identifiers, and Grouped Expressions `(expr)`)

### 3. Semantic Analyzer (`src/analyzer/`)
Before compilation, the AST is validated for structural correctness:
- **Scope Checking**: Uses a symbol table scope stack (`ScopeStack` in [src/shared/scope.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/scope.ts)) to track variables, constants, and functions.
- **Re-declaration Protection**: Prevents duplicate identifier bindings in the same lexical scope.
- **Loop Depth Tracking**: Verifies that `break` and `continue` statements are nested inside loop structures.
- **Function Context Tracking**: Verifies that `return` statements are only placed inside functions.
- **Basic Type Validation**: Checks arithmetic compatibility for operands, preventing invalid additions/subtractions of incompatible types (e.g., adding numbers to objects).
- **Arity Verification**: Checks function call argument counts against their defined parameter lists.

### 4. Bytecode Generator (`src/generator/`)
The generator translates the AST into a linear sequence of instruction bytecodes (a `Uint8Array`).
- **Magic Number**: Prepends the custom binary magic bytes `77` and `72` (`'M'` and `'H'` in decimal) to the executable stream to prevent loading malicious bytecode payloads.
- **Constant Pool**: Maintains a pool ([src/shared/constant-pool.ts](file:///home/hrutav-modha/Documents/programming-language/src/shared/constant-pool.ts)) to store literal numbers, string contents, and variable/function names. The bytecode uses indices targeting this pool to reference constants.
- **Label Patching**: Loops, conditional branches, and function jumps use placeholder indices that are dynamically patched with absolute execution addresses once the target offsets are known during compilation.

### 5. VM Executor (`src/executor/`)
The executor is a stack-based virtual machine runtime environment.
- **Evaluation Stack**: A value stack where operations pull inputs and push results.
- **Call Stack**: A stack that stores instruction pointers to return to when executing functions.
- **Activation Scopes**: Dynamically enters blocks using `ENTER_SCOPE` and exits using `EXIT_SCOPE`, ensuring variable lookup correctness during nested blocks and recursion.
- **Native Calls**: Invokes Node.js native library functions dynamically using `CALL_NATIVE`.

---

## Bytecode Instruction Set Reference

The virtual machine uses a 1-byte OpCode instruction set. For detailed descriptions and stack transitions, see the complete [OPCODES.md](file:///home/hrutav-modha/Documents/programming-language/OPCODES.md) guide.

Key OpCodes:
- `0x01` - `ADD`: Pops `b` and `a`, pushes `b + a`.
- `0x06` - `LOAD_CONST <cpIdx>`: Loads value from the constant pool.
- `0x0A` - `DEFINE_VAR <nameIdx>`: Pops value and defines variable in current scope.
- `0x0E` - `JUMP <target>`: Unconditionally jumps to target instruction pointer.
- `0x1B` - `CALL_NATIVE <nameIdx> <arity>`: Calls standard native function.
- `0x1C` - `CALL <fnIdx> <arity>`: Calls user function.

---

## Project Structure

```
programming-language/
├── src/
│   ├── index.ts                # Application Entry point
│   ├── lexer/                  # Tokenizer
│   │   ├── index.ts
│   │   ├── state.ts
│   │   └── utils.ts
│   ├── parser/                 # AST Builder
│   │   ├── index.ts
│   │   └── state.ts
│   ├── analyzer/               # Semantic verification
│   │   ├── index.ts
│   │   └── state.ts
│   ├── generator/              # AST -> Bytecode Compiler
│   │   ├── index.ts
│   │   ├── state.ts
│   │   └── loop-context.ts
│   ├── executor/               # Stack Machine Virtual Machine
│   │   ├── index.ts
│   │   └── state.ts
│   ├── shared/                 # Common scopes, constants, and errors
│   │   ├── scope.ts
│   │   ├── constant-pool.ts
│   │   ├── native-functions.ts
│   │   └── error.ts
│   └── stdlib/                 # Native System I/O library
│       └── io.ts
├── types/                      # TypeScript typings
│   ├── nodes.d.ts
│   ├── tokens.d.ts
│   ├── scope.d.ts
│   └── loop.d.ts
├── OPCODES.md                  # Instruction set specification
├── package.json                # Project configurations
├── tsconfig.json               # TypeScript options
└── cloc.sh                     # Lines of code counter script
```

---

## Getting Started

### 1. Installation
Clone the repository and install the development dependencies:
```bash
npm install
```

### 2. Execution Example
A typical script can be parsed, compiled, and executed by invoking the interpreter module. You can execute code by loading `src/index.ts` via tools like `tsx` or standard TypeScript execution tools:

```typescript
import { interprete } from './src/index.ts';

interprete(`
    const userInput = input("Enter your name: ");
    print("Welcome, " + userInput + "!");
`);
```

To run the default example in `src/index.ts`:
```bash
# Using tsx to run the TypeScript file directly
npx tsx src/index.ts
```
