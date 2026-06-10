# Bytecode Instruction Set (OpCodes)

This document defines the current instruction set for the virtual machine. Each instruction is represented by a 1-byte OpCode.

| OpCode (Dec) | OpCode (Hex) | Mnemonic | Operands | Stack Effect | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `0x01` | `ADD` | None | `[b, a] -> [b + a]` | Pops two values, adds them, and pushes the result. |
| **2** | `0x02` | `SUB` | None | `[b, a] -> [b - a]` | Pops two values, subtracts `a` from `b`, and pushes the result. |
| **3** | `0x03` | `MUL` | None | `[b, a] -> [b * a]` | Pops two values, multiplies them, and pushes the result. |
| **4** | `0x04` | `DIV` | None | `[b, a] -> [b / a]` | Pops two values, divides `b` by `a`, and pushes the result. |
| **5** | `0x05` | `MOD` | None | `[b, a] -> [b % a]` | Pops two values, computes `b % a`, and pushes the result. |
| **6** | `0x06` | `LOAD_CONST` | 1: `cpIdx` | `[] -> [value]` | Loads a constant from the Constant Pool at index `cpIdx` and pushes it. |
| **7** | `0x07` | `PRINT` | None | `[value] -> []` | Pops a value and prints it to the console. |
| **8** | `0x08` | `NEGATE` | None | `[value] -> [-value]` | Pops a value and pushes its numeric negation. |
| **9** | `0x09` | `NOT` | None | `[value] -> [!value]` | Pops a value and pushes its logical negation. |
| **10** | `0x0A` | `LOAD_NULL` | None | `[] -> [null]` | Pushes `null` onto the stack. |
| **11** | `0x0B` | `DEFINE_VAR` | 1: `nameIdx`| `[value] -> []` | Pops a value and defines it in the Symbol Table. |
| **12** | `0x0C` | `LOAD_VAR` | 1: `nameIdx`| `[] -> [value]` | Retrieves the value of a variable and pushes it. |
| **13** | `0x0D` | `UPDATE_VAR` | 1: `nameIdx`| `[value] -> [value]` | Updates a variable with the popped value. |
| **14** | `0x0E` | `JUMP_IF_FALSE` | 1: `target` | `[cond] -> []` | Pops `cond`. If `false`, jumps to `target`. |
| **15** | `0x0F` | `JUMP` | 1: `target` | `[] -> []` | Unconditionally jumps to `target`. |
| **16** | `0x10` | `GREATER_THAN` | None | `[b, a] -> [a > b]` | Pops `b`, then `a`. Pushes `true` if `a > b`. |
| **17** | `0x11` | `LESS_THAN` | None | `[b, a] -> [a < b]` | Pops `b`, then `a`. Pushes `true` if `a < b`. |
| **18** | `0x12` | `GREATER_THAN_OR_EQUAL` | None | `[b, a] -> [a >= b]` | Pops `b`, then `a`. Pushes `true` if `a >= b`. |
| **19** | `0x13` | `LESS_THAN_OR_EQUAL` | None | `[b, a] -> [a <= b]` | Pops `b`, then `a`. Pushes `true` if `a <= b`. |
| **20** | `0x14` | `EQUAL` | None | `[b, a] -> [a == b]` | Pops `b`, then `a`. Pushes `true` if `a == b`. |
| **21** | `0x15` | `NOT_EQUAL` | None | `[b, a] -> [a != b]` | Pops `b`, then `a`. Pushes `true` if `a != b`. |
| **22** | `0x16` | `ENTER_SCOPE` | None | `[] -> []` | Enters a new block scope by pushing a new Map onto the scope stack. |
| **23** | `0x17` | `EXIT_SCOPE` | None | `[] -> []` | Exits the current block scope by popping it from the scope stack. |
| **24** | `0x18` | `POP` | None | `[value] -> []` | Pops the top value off the evaluation stack. |
| **25** | `0x19` | `DEFINE_CONST` | 1: `nameIdx` | `[value] -> []` | Pops a value and defines it as a constant in the Symbol Table. |
| **26** | `0x1A` | `JUMP_IF_TRUE` | 1: `target` | `[cond] -> []` | Pops `cond`. If `true`, jumps to `target`. |
| **27** | `0x1B` | `DUP` | None | `[value] -> [value, value]` | Duplicates the top value on the stack. |
| **28** | `0x1C` | `CALL_NATIVE` | 1: `nameIdx`, 2: `arity` | `[arg1, ..., argN] -> [result]` | Pops `arity` arguments, retrieves native function name at `nameIdx` from Constant Pool, executes the native function, and pushes the result. |
| **29** | `0x1D` | `CALL` | 1: `arity` | `[arg1, ..., argN] -> [result]` | Calls a user-defined function with `arity` arguments. (Note: Only code generation is implemented; executor execution is pending). |
