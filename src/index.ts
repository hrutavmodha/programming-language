import Analyzer from './analyzer/index.ts'
import AnalyzerState from './analyzer/state.ts'

import Executor from './executor/index.ts'
import ExecutorState from './executor/state.ts'

import Generator from './generator/index.ts'
import GeneratorState from './generator/state.ts'

import Lexer from './lexer/index.ts'
import LexerState from './lexer/state.ts'
import LexerUtils from './lexer/utils.ts'

import Parser from './parser/index.ts'
import ParserState from './parser/state.ts'

export function interprete(src: string): any {
    const lexerState = new LexerState(src)
    const lexerUtils = new LexerUtils()
    const lexer = new Lexer(lexerState, lexerUtils)
    const tokens = lexer.tokenize()
    // console.log("Tokens:", JSON.stringify(tokens, null, 2))

    const parserState = new ParserState(tokens)
    const parser = new Parser(parserState)
    const ast = parser.parse()
    console.log("\nAST:", JSON.stringify(ast, null, 2))

    const analyzerState = new AnalyzerState(ast)
    const analyzer = new Analyzer(analyzerState)

    analyzerState.scopeStack.storeNativeFunction('print', 1, 'void', -1)
    analyzerState.scopeStack.storeNativeFunction('input', 1, 'string', -1)

    const analyzedAst = analyzer.analyze()
    // console.log(JSON.stringify(
    //         analyzerState.scopeStack.getScopeStack(),
    //         (_: any, value: any) => (value instanceof Map ? Object.fromEntries(value) : value),
    //         2
    //     ))
    // console.log("Analyzed AST:", JSON.stringify(analyzedAst, null, 2))

    const generatorState = new GeneratorState(ast)
    const generator = new Generator(generatorState)
    const bytecodes = generator.generate()
    console.log("\nByteCodes:", JSON.stringify(bytecodes, null, 2))

    const executorState = new ExecutorState(bytecodes)
    const executor = new Executor(executorState, generator.getConstantPool())
    
    console.log("\nOutput:")
    executor.execute()
}

interprete(`
    function factorial(n) {
        if n == 0 | n == 1 {
            return n;
        } else {
            return n * factorial(n - 1);
        }
    }

    print(factorial(5)); # Should print 120
`)
