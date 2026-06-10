# Lexer Module

This module is responsible for tokenizing the source text of the programming language into a stream of tokens for the parser.

## 1. Description
The lexer analyzes characters sequentially and aggregates them into tokens representing keywords, identifiers, literals, operators, and punctuation. It tracks source coordinates (row and column) for precise compilation error positioning.

## 2. How to Import
```typescript
import Lexer from './index.ts'
import LexerState from './state.ts'
import LexerUtils from './utils.ts'
```

## 3. Minimal Working Example
```typescript
import Lexer from './index.ts'
import LexerState from './state.ts'
import LexerUtils from './utils.ts'

const state = new LexerState('let count = 5;')
const utils = new LexerUtils()
const lexer = new Lexer(state, utils)

const tokens = lexer.tokenize()
console.log(tokens)
```

## 4. API Reference
* [Lexer](file:///home/hrutav-modha/Documents/programming-language/src/lexer/index.ts): Main class that coordinates tokenization.
  * `tokenize()`: Scan through characters and return an array of [Token](file:///home/hrutav-modha/Documents/programming-language/types/tokens.d.ts) objects.
* [LexerState](file:///home/hrutav-modha/Documents/programming-language/src/lexer/state.ts): Manages parsing cursor position, current row/column indexing, and the token accumulator list.
* [LexerUtils](file:///home/hrutav-modha/Documents/programming-language/src/lexer/utils.ts): Helper functions verifying classifications (digits, symbols, spacing).

## 5. Design Constraints & Status
* Guest-level escape sequences (e.g., a literal backslash `\` followed by `n` or `t` in source files) are not evaluated into control characters by the lexer and remain raw characters. However, if the host JavaScript engine resolves escape sequences beforehand (such as within JavaScript template literals passed to the interpreter), the resulting raw control characters (tab, newline) are preserved and outputted correctly.
